# Info-Vis-Lucia-Alvarez-A3

## Visualization Description
This project implements an interactive heatmap showing maternal mortality rates by region and year.

### Visual Encodings
- **X-axis**: Year (temporal)
- **Y-axis**: Region (categorical)
- **Color**: Maternal mortality rate (quantitative)
- **Opacity**: Used to highlight a selected region on hover

### Interaction & Animation
- **Tooltip on hover** with detailed data values
- **Row highlighting**: when hovering over a cell, all cells from the same region remain opaque while others fade
- **Sorting dropdown**:  
  - Alphabetical  
  - Maternal mortality (ascending)  
  - Maternal mortality (descending)
- **Smooth transitions** when reordering the heatmap rows
- **Animated opacity transitions** on hover

---

## Dataset
Source: **World Development Indicators (WDI)**, World Bank  
https://datacatalog.worldbank.org/search/dataset/0037712/World-Development-Indicators  

Subset: Maternal mortality indicators aggregated by region and year (CSV).

---

## Repository Structure
index.html → main webpage
style.css → styling
script.js → D3.js heatmap implementation
d3_dataset.csv → subset of the WDI dataset used for the visualization
screenshot.png → reference screenshot for assignment submission

---

## How to Run the Visualization
No build step is required.

1. Download or clone the repository  
2. Open **index.html** in any modern browser  
3. The visualization loads automatically using the local CSV dataset  

The project is also deployed using **GitHub Pages** for easy access.

## Live Demo
https://luciaalvarezgom.github.io/Info-Vis-Lucia-Alvarez-A3/ 

## Source Code
https://github.com/luciaalvarezgom/Info-Vis-Lucia-Alvarez-A3  

---

## Use of Generative AI
ChatGPT was only used for:
- Debugging D3 errors with selections and transitions
- Correction of grammar

All implementation decisions, design choices, and the final D3 code were written and adapted manually by me

