#!/usr/bin/env python3

# Copyright The Hyve B.V. 2014
# License: GPL version 3 or higher

import sys
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
environment = jinja2.Environment(loader=loader)
environment.filters['color'] = lambda length: match_colors[color_idx(length)]

def match_colors():
    """
    An iterator that yields lists of length-color pairs. 
    """
    
    hits = blast.BlastOutput_iterations.Iteration.Iteration_hits.Hit
    query_length = blast["BlastOutput_query-len"]
    # sort hits by longest hotspot first
    hits = sorted(hits, key=lambda h: max(hsp['Hsp_align-len'] for hsp in h.Hit_hsps.Hsp), reverse=True)

    for hit in hits:
        # sort hotspots from short to long, so we can overwrite index colors of
        # short matches with those of long ones.
        hotspots = sorted(hit.Hit_hsps.Hsp, key=lambda hsp: hsp['Hsp_align-len'])
        table = bytearray([255]) * query_length
        for hsp in hotspots:
            frm = hsp['Hsp_query-from'] - 1
            to = hsp['Hsp_query-to'] - 1
            table[frm:to] = repeat(color_idx(hsp['Hsp_align-len']), to - frm)

        matches = []
        last = table[0]
        count = 0
        for i in range(int(query_length)):
            if table[i] == last:
                count += 1
                continue
            matches.append((count, colors[last] if last != 255 else 'none'))
            last = table[i]
            count = 1
        matches.append((count, colors[last] if last != 255 else 'none'))

        yield dict(colors=matches, link="#hit"+hit.Hit_num.text)


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
                                     hits=blast.BlastOutput_iterations.Iteration.Iteration_hits.Hit,
                                     colors=colors,
                                     match_colors=match_colors(),
                                     params=params))

main()
