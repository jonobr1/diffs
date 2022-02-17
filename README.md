# diffs
A collection of components to visually compare texts

## Roadmap

- [ ] Turn global actions / navigation up top to a Figma style layers
- [ ] On paste don't strip carriage returns
- [x] Recalculate all counts (and visualization) when any text changes
- [x] Turn highlighted word / words into a canonical term (stem via Porter2)
- [x] Highlights should happen in visualization too
- [x] Add ability to highlight key terms in visualization
- [x] Add graph lines to better resolve hierarchy of visualization
- [x] Filter out non-words from visualization (or focus on types of words? E.g: verbs)
- [x] Save state of application to localStorage
- [x] Sort by frequency, alphabetic, etc.
- [x] Add a loading gif to the visualization when processing
- [x] Arcs and highlights don't work on sorted lists
- [x] Set `MAX_ITERATIONS` based on the length of texts
