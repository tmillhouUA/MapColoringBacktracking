# Map Coloring w/ Backtracking

An interactive, browser-based visualization of backtracking search for the US map 4-coloring CSP (Constraint Satisfaction Problem) built with D3.js. Animates how the algorithm assigns colors to all 50 US states and DC while satisfying the constraint that no two adjacent states share a color.

## Algorithm

The visualization implements **depth-first backtracking search** with configurable variable ordering and constraint filtering heuristics. The search explores partial assignments, detects constraint violations, and backtracks when no legal color exists for a variable.

## Variable Ordering

| Option | Description |
|---|---|
| None | States assigned in default order |
| Degree | States with the most neighbors attempted first |
| Min Remaining Vals (MRV) | Dynamically selects the most constrained unassigned state at each step; starts from Arizona |

## Filtering

| Option | Description |
|---|---|
| None | Constraints checked only against already-assigned neighbors |
| Forward Checking (FC) | After each assignment, prunes the color from all unassigned neighbors' domains; rejects the node immediately if any neighbor's domain becomes empty |
| AC-3 | Extends forward checking with full arc consistency propagation across the constraint graph after each assignment |

## Controls

| Control | Function |
|---|---|
| Play / Pause | Start or pause the animation |
| Step | Advance one complete assignment (plays the full highlight animation then stops) |
| Reset | Clear the map and restart with current settings |
| Speed slider | Adjust playback speed from 1–120 fps |

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

All dependencies are bundled locally in the `d3/` folder — no internet connection required.

| Library | Version |
|---|---|
| D3 | v4 |
| d3-scale-chromatic | v1 |
| d3-contour | v1 |
| d3-3d | — |
