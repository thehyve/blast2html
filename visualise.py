#!/usr/bin/env python3

# Copyright The Hyve B.V. 2014
# License: GPL version 3 or higher

import sys
import math
import warnings
from itertools import repeat
from lxml import objectify
import jinja2


blast = objectify.parse('blast xml example1.xml').getroot()
loader = jinja2.FileSystemLoader(searchpath='.')
environment = jinja2.Environment(loader=loader, lstrip_blocks=True, trim_blocks=True, autoescape=True)

def filter(func_or_name):
    "Decorator to register a function as filter in the current jinja environment"
    if isinstance(func_or_name, str):
        def inner(func):
            environment.filters[func_or_name] = func
            return func
        return inner
    else:
        environment.filters[func_or_name.__name__] = func_or_name
        return func_or_name


def color_idx(length):
    if length < 40:
        return 0
    elif length < 50:
        return 1
    elif length < 80:
        return 2
    elif length < 200:
        return 3
    return 4

colors = ['black', 'blue', 'green', 'magenta', 'red']

environment.filters['color'] = lambda length: match_colors[color_idx(length)]

@filter
def fmt(val, fmt):
    return format(float(val), fmt)

@filter
def firsttitle(hit):
    return hit.Hit_def.text.split('>')[0]

@filter
def othertitles(hit):
    """Split a hit.Hit_def that contains multiple titles up, splitting out the hit ids from the titles."""
    id_titles = hit.Hit_def.text.split('>')

    titles = []
    for t in id_titles[1:]:
        fullid, title = t.split(' ', 1)
        id = fullid.split('|', 2)[2]
        titles.append(dict(id = id,
                           fullid = fullid,
                           title = title))
    return titles

@filter
def hitid(hit):
    return hit.Hit_id.text.split('|', 2)[1]

@filter
def seqid(hit):
    return hit.Hit_id.text.split('|', 2)[2]

@filter
def alignment_pre(hsp):
    return (
        "Query  {:>7s}  {}  {}\n".format(hsp['Hsp_query-from'], hsp.Hsp_qseq, hsp['Hsp_query-to']) +
        "       {:7s}  {}\n".format('', hsp.Hsp_midline) +
        "Subject{:>7s}  {}  {}".format(hsp['Hsp_hit-from'], hsp.Hsp_hseq, hsp['Hsp_hit-to'])
    )

@filter('len')
def hsplen(node):
    return int(node['Hsp_align-len'])

@filter
def asframe(frame):
    if frame == 1:
        return 'Plus'
    elif frame == -1:
        return 'Minus'
    raise Exception("frame should be either +1 or -1")


query_length = int(blast["BlastOutput_query-len"])

hits = blast.BlastOutput_iterations.Iteration.Iteration_hits.Hit
# sort hits by longest hotspot first
ordered_hits = sorted(hits,
                      key=lambda h: max(hsplen(hsp) for hsp in h.Hit_hsps.Hsp),
                      reverse=True)

def match_colors():
    """
    An iterator that yields lists of length-color pairs. 
    """

    percent_multiplier = 100 / query_length
    
    for hit in hits:
        # sort hotspots from short to long, so we can overwrite index colors of
        # short matches with those of long ones.
        hotspots = sorted(hit.Hit_hsps.Hsp, key=lambda hsp: hsplen(hsp))
        table = bytearray([255]) * query_length
        for hsp in hotspots:
            frm = hsp['Hsp_query-from'] - 1
            to = int(hsp['Hsp_query-to'])
            table[frm:to] = repeat(color_idx(hsplen(hsp)), to - frm)

        matches = []
        last = table[0]
        count = 0
        for i in range(query_length):
            if table[i] == last:
                count += 1
                continue
            matches.append((count * percent_multiplier, colors[last] if last != 255 else 'none'))
            last = table[i]
            count = 1
        matches.append((count * percent_multiplier, colors[last] if last != 255 else 'none'))

        yield dict(colors=matches, link="#hit"+hit.Hit_num.text, defline=firsttitle(hit))


def queryscale():
    max_labels = 10
    skip = math.ceil(query_length / max_labels)
    percent_multiplier = 100 / query_length
    for i in range(1, query_length+1):
        if i % skip == 0:
            yield dict(label = i, width = skip * percent_multiplier)
    if query_length % skip != 0:
        yield dict(label = query_length, width = (query_length % skip) * percent_multiplier)


def hit_info():

    for hit in ordered_hits:
        hsps = hit.Hit_hsps.Hsp

        cover = [False] * query_length
        for hsp in hsps:
            cover[hsp['Hsp_query-from']-1 : int(hsp['Hsp_query-to'])] = repeat(True, hsplen(hsp))
        cover_count = cover.count(True)
        
        def hsp_val(path):
            return (hsp[path] for hsp in hsps)
        
        yield dict(hit = hit,
                   title = firsttitle(hit),
                   link_id = hit.Hit_num,
                   maxscore = "{:.1f}".format(float(max(hsp_val('Hsp_bit-score')))),
                   totalscore = "{:.1f}".format(float(sum(hsp_val('Hsp_bit-score')))),
                   cover = "{:.0%}".format(cover_count / query_length),
                   e_value = "{:.4g}".format(float(min(hsp_val('Hsp_evalue')))),
                   # FIXME: is this the correct formula vv?
                   ident = "{:.0%}".format(float(min(hsp.Hsp_identity / hsplen(hsp) for hsp in hsps))),
                   accession = hit.Hit_accession)


def main():
    template = environment.get_template('visualise.html.jinja')

    params = (('Query ID', blast["BlastOutput_query-ID"]),
              ('Query definition', blast["BlastOutput_query-def"]),
              ('Query length', blast["BlastOutput_query-len"]),
              ('Program', blast.BlastOutput_version),
              ('Database', blast.BlastOutput_db),
            )

    if len(blast.BlastOutput_iterations.Iteration) > 1:
        warnings.warn("Multiple 'Iteration' elements found, showing only the first")

    sys.stdout.write(template.render(blast=blast,
                                     length=query_length,
                                     hits=blast.BlastOutput_iterations.Iteration.Iteration_hits.Hit,
                                     colors=colors,
                                     match_colors=match_colors(),
                                     queryscale=queryscale(),
                                     hit_info=hit_info(),
                                     params=params))

main()

# http://www.ncbi.nlm.nih.gov/nucleotide/557804451?report=genbank&log$=nuclalign&blast_rank=1&RID=PHWP1JNZ014
# http://www.ncbi.nlm.nih.gov/nuccore/557804451?report=graph&rid=PHWP1JNZ014[557804451]&tracks=[key:sequence_track,name:Sequence,display_name:Sequence,id:STD1,category:Sequence,annots:Sequence,ShowLabel:true][key:gene_model_track,CDSProductFeats:false][key:alignment_track,name:other%20alignments,annots:NG%20Alignments%7CRefseq%20Alignments%7CGnomon%20Alignments%7CUnnamed,shown:false]&v=752:2685&appname=ncbiblast&link_loc=fromSubj

# http://www.ncbi.nlm.nih.gov/nucleotide/557804451?report=genbank&log$=nucltop&blast_rank=1&RID=PHWP1JNZ014
