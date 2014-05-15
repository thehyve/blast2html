#!/bin/sh

# run this from the directory it exists in to update the test outputs

for i in 1 2 3 4
do
	../blast2html.py -i "blast xml example$i.xml" -o "blast xml example$i.html"
done
