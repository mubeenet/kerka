# Kerka

Web Components backed by Chart.js, organized as independently importable
packages. The first target is an interactive 3D pie chart matching the reference
image in this repository.

## Project direction

The repository uses Chart.js for animation, interaction, tooltips, legends,
responsive sizing, and dataset updates. Web Components provide the public browser
API and own the Chart.js instance lifecycle.

The 3D pie must be implemented as a custom Chart.js chart type rather than as a
drawing-only plugin. Its elliptical projection changes both rendering and hit
testing, so it needs a custom controller and element:

```text
<kerka-3d-pie-chart>
          │
          ▼
@graph-web-component/chart
  shared Chart.js Web Component lifecycle
          │
          ▼
@graph-web-component/3d-pie-chart
  ThreeDPieController extends DoughnutController
  ThreeDArcElement extends ArcElement
  registration, types, defaults, and Web Component
```

Chart.js is a peer dependency. ESM applications bundle it normally; classic
browser usage can provide Chart.js separately through a `<script>` tag.

## Proposed package responsibilities

### `@graph-web-component/chart`

Shared Chart.js/Web Component integration only:

- Shadow DOM and Canvas ownership
- Chart.js instance lifecycle
- Property-to-chart update scheduling
- Teardown and reconnection
- Accessible text fallback

It must not contain 3D pie geometry or styling.

### `@graph-web-component/3d-pie-chart`

All 3D pie-specific behavior:

```text
types.ts                         public data and option types
three-d-arc-element.ts           drawing, projection, and hit testing
three-d-pie-controller.ts        layout, updates, and rendering order
three-d-pie-chart-element.ts     Web Component API
register.ts                      Chart.js component registration
define.ts                        custom-element registration
index.ts                         public exports
```

### `@graph-web-component/line-chart`

The reference line chart now uses the shared Chart.js component lifecycle. The
former custom Canvas renderer and scales package were removed during migration.

## Usage

### Browser scripts

No JavaScript import is required. Prerequisite: Chart.js `^4.5.1`, using its
UMD build so it creates the global `Chart` object.

Load Chart.js first, then `kerka.umd.min.js`. Both scripts may use `defer`:
deferred classic scripts still execute in document order, after HTML parsing.
Do not use `async`, because it does not preserve execution order.

```html
<script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js"></script>
<script defer src="/dist/kerka.umd.min.js"></script>

<kerka-3d-pie-chart>
  <kerka-pie-slice label="Blue" value="458" color="#3366cc"></kerka-pie-slice>
  <kerka-pie-slice label="Red" value="83" color="#dc3912"></kerka-pie-slice>
</kerka-3d-pie-chart>
```

`kerka.umd.min.js` intentionally excludes Chart.js. It uses the global
`Chart` supplied by `chart.umd.min.js`, so other charts on the page share the
same Chart.js runtime and registry. Loading `kerka.umd.min.js` before Chart.js
fails because the required global does not exist.

CDN hosting is optional. Self-hosted files work the same way:

```html
<script defer src="/assets/js/chart.umd.min.js"></script>
<script defer src="/assets/js/kerka.umd.min.js"></script>
```

The second script automatically registers the Chart.js components and defines
`<kerka-3d-pie-chart>` and `<kerka-pie-slice>`. No inline JavaScript is needed.

The build writes both browser bundles to the repository-level `dist/` directory:

- `kerka.umd.min.js` is the classic UMD build and expects the global `Chart`.
- `kerka.min.js` is the ES module build and imports the `chart.js` peer dependency.

### Web Component

```ts
import { defineThreeDPieChart } from '@graph-web-component/3d-pie-chart';

defineThreeDPieChart();
```

```html
<kerka-3d-pie-chart
  aria-label="Distribution by category"
  depth="46"
  hover-offset="8"
  offset="6"
  reversed
  rotation="-90"
  show-percentage
  show-tooltip
  side-shade="0.28"
  vertical-scale="0.68"
>
  <kerka-pie-slice label="Blue" value="458" color="#3366cc">
  </kerka-pie-slice>
  <kerka-pie-slice label="Red" value="83" color="#dc3912">
  </kerka-pie-slice>
</kerka-3d-pie-chart>
```

Adding, removing, or changing a direct `<kerka-pie-slice>` child updates the
existing chart instance. Each slice requires `label`, `value`, and `color`.

The chart accepts these presentation attributes:

| Attribute | Default | Description |
| --- | ---: | --- |
| `depth` | `32` | Extrusion depth in pixels |
| `hover-offset` | `8` | Additional offset for a hovered slice |
| `offset` | `0` | Persistent offset for every slice |
| `reversed` | absent | Reverses slice rotation direction when present |
| `rotation` | `-90` | Starting rotation in degrees |
| `show-percentage` | absent | Displays percentage labels when present |
| `show-tooltip` | absent | Displays Chart.js hover tooltips when present |
| `side-shade` | `0.28` | Side-face darkening from `0` through `1` |
| `vertical-scale` | `0.68` | Vertical ellipse scale above `0` through `1` |

### Direct Chart.js registration

```ts
import { Chart } from 'chart.js';
import {
  registerThreeDPieChartComponents,
} from '@graph-web-component/3d-pie-chart';

registerThreeDPieChartComponents();

new Chart(canvas, {
  type: 'threeDPie',
  data: {
    labels: ['Blue', 'Red'],
    datasets: [{
      data: [458, 83],
      backgroundColor: ['#3366cc', '#dc3912'],
      depth: 46,
      offset: 6,
      sideShade: 0.28,
      verticalScale: 0.68,
    }],
  },
  options: { reversed: true },
});
```

ESM usage uses the installed `chart.js` peer dependency. Browser-script usage
may use any compatible hosted or local Chart.js UMD file.

## Development

Current workspace commands:

```bash
pnpm install
pnpm build
pnpm example
```

The declarative example is in `examples/basic/index.html`; `main.ts` only
registers the custom elements.
