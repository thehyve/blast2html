#!/usr/bin/env python3

# Copyright The Hyve B.V. 2014
# License: GPL version 3 or higher

import sys
import math
import warnings
from itertools import repeat
import argparse
from lxml import objectify
import jinja2



_filters = {}
def filter(func_or_name):
    "Decorator to register a function as filter in the current jinja environment"
    if isinstance(func_or_name, str):
        def inner(func):
            _filters[func_or_name] = func
            return func
        return inner
    else:
        _filters[func_or_name.__name__] = func_or_name
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
        hitid, id = fullid.split('|', 2)[1:3]
        titles.append(dict(id = id,
                           hitid = hitid,
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

def genelink(hit, type='genbank', hsp=None):
    if not isinstance(hit, str):
        hit = hitid(hit)
    link = "http://www.ncbi.nlm.nih.gov/nucleotide/{}?report={}&log$=nuclalign".format(hit, type)
    if hsp != None:
        link += "&from={}&to={}".format(hsp['Hsp_hit-from'], hsp['Hsp_hit-to'])
    return jinja2.Markup(link)




class BlastVisualize:

    colors = ('black', 'blue', 'green', 'magenta', 'red')

    max_scale_labels = 10

    templatename = 'visualise.html.jinja'

    def __init__(self, input):
        self.input = input

        self.blast = objectify.parse(self.input).getroot()
        self.loader = jinja2.FileSystemLoader(searchpath='.')
        self.environment = jinja2.Environment(loader=self.loader,
                                              lstrip_blocks=True, trim_blocks=True, autoescape=True)

        self.environment.filters['color'] = lambda length: match_colors[color_idx(length)]

        for name, filter in _filters.items():
            self.environment.filters[name] = filter

        self.query_length = int(self.blast["BlastOutput_query-len"])
        self.hits = self.blast.BlastOutput_iterations.Iteration.Iteration_hits.Hit
        # sort hits by longest hotspot first
        self.ordered_hits = sorted(self.hits,
                                   key=lambda h: max(hsplen(hsp) for hsp in h.Hit_hsps.Hsp),
                                   reverse=True)

    def render(self, output):
        template = self.environment.get_template(self.templatename)

        params = (('Query ID', self.blast["BlastOutput_query-ID"]),
                  ('Query definition', self.blast["BlastOutput_query-def"]),
                  ('Query length', self.blast["BlastOutput_query-len"]),
                  ('Program', self.blast.BlastOutput_version),
                  ('Database', self.blast.BlastOutput_db),
        )

        if len(self.blast.BlastOutput_iterations.Iteration) > 1:
            warnings.warn("Multiple 'Iteration' elements found, showing only the first")

        output.write(template.render(blast=self.blast,
                                          length=self.query_length,
                                          hits=self.blast.BlastOutput_iterations.Iteration.Iteration_hits.Hit,
                                          colors=self.colors,
                                          match_colors=self.match_colors(),
                                          queryscale=self.queryscale(),
                                          hit_info=self.hit_info(),
                                          genelink=genelink,
                                          params=params))
            

    def match_colors(self):
        """
        An iterator that yields lists of length-color pairs. 
        """

        percent_multiplier = 100 / self.query_length

        for hit in self.hits:
            # sort hotspots from short to long, so we can overwrite index colors of
            # short matches with those of long ones.
            hotspots = sorted(hit.Hit_hsps.Hsp, key=lambda hsp: hsplen(hsp))
            table = bytearray([255]) * self.query_length
            for hsp in hotspots:
                frm = hsp['Hsp_query-from'] - 1
                to = int(hsp['Hsp_query-to'])
                table[frm:to] = repeat(color_idx(hsplen(hsp)), to - frm)

            matches = []
            last = table[0]
            count = 0
            for i in range(self.query_length):
                if table[i] == last:
                    count += 1
                    continue
                matches.append((count * percent_multiplier, self.colors[last] if last != 255 else 'none'))
                last = table[i]
                count = 1
            matches.append((count * percent_multiplier, self.colors[last] if last != 255 else 'none'))

            yield dict(colors=matches, link="#hit"+hit.Hit_num.text, defline=firsttitle(hit))


    def queryscale(self):
        skip = math.ceil(self.query_length / self.max_scale_labels)
        percent_multiplier = 100 / self.query_length
        for i in range(1, self.query_length+1):
            if i % skip == 0:
                yield dict(label = i, width = skip * percent_multiplier)
        if self.query_length % skip != 0:
            yield dict(label = self.query_length, width = (self.query_length % skip) * percent_multiplier)


    def hit_info(self):

        for hit in self.ordered_hits:
            hsps = hit.Hit_hsps.Hsp

            cover = [False] * self.query_length
            for hsp in hsps:
                cover[hsp['Hsp_query-from']-1 : int(hsp['Hsp_query-to'])] = repeat(True, hsplen(hsp))
            cover_count = cover.count(True)

            def hsp_val(path):
                return (float(hsp[path]) for hsp in hsps)

            yield dict(hit = hit,
                       title = firsttitle(hit),
                       link_id = hit.Hit_num,
                       maxscore = "{:.1f}".format(max(hsp_val('Hsp_bit-score'))),
                       totalscore = "{:.1f}".format(sum(hsp_val('Hsp_bit-score'))),
                       cover = "{:.0%}".format(cover_count / self.query_length),
                       e_value = "{:.4g}".format(min(hsp_val('Hsp_evalue'))),
                       # FIXME: is this the correct formula vv?
                       ident = "{:.0%}".format(float(min(hsp.Hsp_identity / hsplen(hsp) for hsp in hsps))),
                       accession = hit.Hit_accession)


def main():

    parser = argparse.ArgumentParser(description="Convert a BLAST XML result into a nicely readable html page",
                                     usage="{} [-i] INPUT [-o OUTPUT]".format(sys.argv[0]))
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument('positional_arg', metavar='INPUT', nargs='?', type=argparse.FileType(mode='r'),
                             help='The input Blast XML file, same as -i/--input')
    input_group.add_argument('-i', '--input', type=argparse.FileType(mode='r'), 
                             help='The input Blast XML file')
    parser.add_argument('-o', '--output', type=argparse.FileType(mode='w'), default=sys.stdout,
                        help='The output html file')

    args = parser.parse_args()
    if args.input == None:
        args.input = args.positional_arg
    if args.input == None:
        parser.error('no input specified')

    b = BlastVisualize(args.input)
    b.render(args.output)


if __name__ == '__main__':
    main()

