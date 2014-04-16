(cd coverage_generator/; ./covgen.py > ../seed.yaml) && mapproxy-seed -s seed.yaml -f mapproxy.yaml -c 15
