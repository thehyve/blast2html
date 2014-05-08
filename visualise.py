#!/usr/bin/env python3

# Copyright The Hyve B.V. 2014
# License: GPL version 3 or higher

import sys
import math
import warnings
from itertools import repeat
from lxml import objectify
import jinja2


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

blast = objectify.parse('blast xml example1.xml').getroot()
loader = jinja2.FileSystemLoader(searchpath='.')
environment = jinja2.Environment(loader=loader, lstrip_blocks=True, trim_blocks=True, autoescape=True)
environment.filters['color'] = lambda length: match_colors[color_idx(length)]

query_length = int(blast["BlastOutput_query-len"])

hits = blast.BlastOutput_iterations.Iteration.Iteration_hits.Hit
# sort hits by longest hotspot first
ordered_hits = sorted(hits,
                      key=lambda h: max(hsp['Hsp_align-len'] for hsp in h.Hit_hsps.Hsp),
                      reverse=True)

def match_colors():
    """
    An iterator that yields lists of length-color pairs. 
    """

    percent_multiplier = 100 / query_length
    
    for hit in hits:
        # sort hotspots from short to long, so we can overwrite index colors of
        # short matches with those of long ones.
        hotspots = sorted(hit.Hit_hsps.Hsp, key=lambda hsp: hsp['Hsp_align-len'])
        table = bytearray([255]) * query_length
        for hsp in hotspots:
            frm = hsp['Hsp_query-from'] - 1
            to = int(hsp['Hsp_query-to'])
            table[frm:to] = repeat(color_idx(hsp['Hsp_align-len']), to - frm)

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

        yield dict(colors=matches, link="#hit"+hit.Hit_num.text, defline=hit.Hit_def)


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
            cover[hsp['Hsp_query-from']-1 : int(hsp['Hsp_query-to'])] = repeat(True, int(hsp['Hsp_align-len']))
        cover_count = cover.count(True)
        
        def hsp_val(path):
            return (hsp[path] for hsp in hsps)
        
        yield dict(description = hit.Hit_def,
                   maxscore = max(hsp_val('Hsp_bit-score')),
                   totalscore = sum(hsp_val('Hsp_bit-score')),
                   cover = "{:.0%}".format(cover_count / query_length),
                   e_value = min(hsp_val('Hsp_evalue')),
                   # FIXME: is this the correct formula vv?
                   ident = "{:.0%}".format(min(hsp.Hsp_identity / hsp['Hsp_align-len'] for hsp in hsps)),
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
                                     #hits=blast.BlastOutput_iterations.Iteration.Iteration_hits.Hit,
                                     colors=colors,
                                     match_colors=match_colors(),
                                     queryscale=queryscale(),
                                     hit_info=hit_info(),
                                     params=params))

main()
