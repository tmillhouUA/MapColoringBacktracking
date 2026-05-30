# Map Coloring w/ Backtracking

An interactive, browser-based visualization of backtracking search for the US map 4-coloring CSP (Constraint Satisfaction Problem) built with D3.js. Animates how the algorithm assigns colors to all 50 US states and DC while satisfying the constraint that no two adjacent states share a color.

## Algorithm

The visualization implements **depth-first backtracking search** with configurable variable ordering heuristics and inference methods. The search explores partial assignments, detects constraint violations, and backtracks when no legal color exists for a variable.

## Variable Ordering

| Option | Description |
|---|---|
| None | States assigned in default order |
| Deg | Pick states in order of most neighbors to fewest |
| MRV | Pick state with fewest legal colors next |

## Inference

| Option | Description |
|---|---|
| None | No inference about unassigned neighbors |
| FC | Forward Checking - prune assigned color from unassigned neighbors immediately |
| MAC | Maintaining Arc Consistency - run localized AC-3 after each assignment |

## Controls

| Control | Function |
|---|---|
| Play / Pause | Start or pause the animation |
| Step | Advance one complete assignment (plays the full highlight animation then stops) |
| Reset | Clear the map and restart with current settings |
| Speed slider | Adjust playback speed from 1-120 fps |

## Display

Each assignment is animated in three frames: the target state enlarges with a background fill (floating effect), then receives its assigned color, then returns to normal size. The left progress bar tracks the fraction of states assigned.

The stats panel (bottom right) shows:

| Stat | Description |
|---|---|
| Current Variable | State being assigned in the current step |
| Assigned | Number of states assigned out of 51 |
| Nodes Explored | Total nodes popped from the frontier |
| Backtracks | Number of times the search retreated to a shallower assignment |
| Failed Assignments | Number of individual color attempts rejected by constraint checking |
| Max Frontier Size | Peak number of nodes queued simultaneously (memory usage proxy) |

## Usage

A live version is available at [tmillhouua.github.io/MapColoringBacktracking](https://tmillhouua.github.io/MapColoringBacktracking/).

Alternatively, clone or download the repository and open `index.html` directly in a browser. The visualization runs entirely in the browser with no build step or server required.

## Dependencies

All dependencies are bundled locally in the `d3/` folder - no internet connection required.

| Library | Version |
|---|---|
| D3 | v4 |
| d3-scale-chromatic | v1 |
| d3-contour | v1 |
| d3-3d | - |
