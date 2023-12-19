# @allmaps/maplibre

Allmaps plugin for [MapLibre](https://maplibre.org/). This plugin allows displaying georeferenced [IIIF images](https://iiif.io/) on a MapLibre map. The plugin works by loading [Georeference Annotations](https://preview.iiif.io/api/georef/extension/georef/) and uses WebGL to transform images from a IIIF image server to overlay them on their correct geographical position. See [allmaps.org](https://allmaps.org) for more information.

## How it works

This plugin creates a new class `WarpedMapLayer` which extends and behaves like a [MapLibre Layer](https://maplibre.org/maplibre-style-spec/layers/). You can add one or multiple Georeference Annotations (or Georeference Annotation Pages) to a WarpedMapLayer, and add the WarpedMapLayer to your MapLibre map. This will render all Georeferenced Maps contained in the annotation (pages) on your MapLibre map!

To understand what happens under the hood for each Georeferenced Map, see the [@allmaps/render](../render/README.md) package.

## Installation

This package works in browsers and in Node.js as an ESM module.

Install with npm:

```sh
npm install @allmaps/maplibre
```

And load using:

```js
import { WarpedMapLayer } from '@allmaps/maplibre'
```

You can build this package using

```sh
pnpm run build
```

As an alternative to loading using import, ESM and UMD bundled versions of the code are also provided under `/dist/bundled` (once the code is built). These are also published online, so can load them directly in a HTML script tag using a CDN.

```html
<script src="https://cdn.jsdelivr.net/npm/@allmaps/maplibre/dist/bundled/allmaps-maplibre-3.3.umd.js"></script>
```

*Note: this package is under review and not published yet, so this CND link doesn't exist yet!*

When loading as bundled code, the package's functions are available under the `Allmaps` global variable:

```js
// ... (see 'Usage' below)
const warpedMapLayer = new Allmaps.WarpedMapLayer()
// ...
```

## Usage

Built for MapLibre 3.3, but should work with earlier versions as well.

### Loading an annotation

Creating a layer adding it to map looks like this:

```js
import { WarpedMapLayer } from '@allmaps/maplibre'

// MapLibre map with base layer
const map = new maplibregl.Map({
  container: 'map',
  style:
      'https://api.maptiler.com/maps/streets/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
  center: [-71.0599, 42.3589],
  zoom: 13,
  pitchWithRotate: false, // Disable pitch on your map
  antialias: true // Consider activating antialiasing
})

const warpedMapLayer = new WarpedMapLayer()

map.on('load', async () => {
  map.addLayer(warpedMapLayer)
})
```

WarpedMapLayer is implemented using MapLibre's [CustomLayerInterface](https://maplibre.org/maplibre-gl-js/docs/API/interfaces/maplibregl.CustomLayerInterface/), which allows it to draw directly into the map's WebGL context using the map's camera. Although it can be added to a map (possibly in between other layers) like usual using `map.addLayer()`, there are some differences to a normal layer to take into account:

*   WarpedMapLayer does not make use of a [Source](https://maplibre.org/maplibre-style-spec/sources/) (although that could be implemented in the future, similar to [@allmaps/openlayers](../openlayers/README.md)).
*   WarpedMapLayer can't be styles using the [MapLibre Style Spec](https://maplibre.org/maplibre-style-spec/).
*   Just like other MapLibre layers, a WarpedMapLayer must have a unique `id`. By default, the `id` has the value `warped-map-layer`. When adding multiple WarpedMapLayers to your map, pass a unique `id` value to their constructor: `const warpedMapLayerWithUniqueId = new WarpedMapLayer('my-unique-id')`
*   WarpedMapLayer does not support pitching, so disable it on your map. Enabling antialiasing on your map will create the WebGL context with MSAA antialiasing, so custom layers like the WarpedMapLayer are antialiased, which may improve the visual result.

A Georeference Annotation can be added to a WarpedMapLayer using the functions `addGeoreferenceAnnotation()` or `addGeoreferenceAnnotationByUrl()`, which will render it as part of the WarpedMapLayer on the OpenLayers map. Here's an example of the first using `fetch()` and `then()`.

```js
const annotationUrl = 'https://annotations.allmaps.org/images/813b0579711371e2@2c1d7e89d8c309e8'

map.on('load', async () => {
  map.addLayer(warpedMapLayer)

  fetch(annotationUrl)
    .then((response) => response.json())
    .then((annotation) => {
      warpedMapLayer.addGeoreferenceAnnotation(annotation)
    })
})
```

And here's an example of the later inside the nameless call-back function of the 'load' event.

```js
map.on('load', async () => {
  map.addLayer(warpedMapLayer)

  await warpedMapLayer.addGeoreferenceAnnotationByUrl(annotationUrl)
})
```

### Example

Once this package is published, a CodePen example will be added here.

### Events

The following events are emitted to inform you of the state of the WarpedMapLayer.

| Description                                                   | Type                      | Data                               |
|---------------------------------------------------------------|---------------------------|------------------------------------|
| A warped map has been added to the warped map list            | `warpedmapadded`          | `mapId: string`                    |
| A warped map has been removed from the warped map list        | `warpedmapremoved`        | `mapId: string`                    |
| A warped map enters the viewport                              | `warpedmapenter`          | `mapId: string`                    |
| A warped map leaves the viewport                              | `warpedmapleave`          | `mapId: string`                    |
| The visibility of some warpedMaps has changed                 | `visibilitychanged`       | `mapIds: string[]`                 |
| The cache loaded a first tile of a map                        | `firstmaptileloaded`      | `{mapId: string, tileUrl: string}` |
| All tiles requested for the current viewport have been loaded | `allrequestedtilesloaded` |                                    |

You can listen to them in the typical MapLibre way. Here's an example:

```js
map.on('warpedmapadded', (event) => {console.log(event.mapId, warpedMapLayer.getTotalBounds())}, map)
```

Some of the functions specified in the API only make sense once a warped map is loaded into the WarpedMapLayer. You can use such listeners to make sure function are run e.g. only after a warped map has been added.

### What is a 'map'?

Both MapLibre and Allmaps have a concept named a 'map'.

A MapLibre map is an instance of the [MapLibre Map Class](https://maplibre.org/maplibre-gl-js/docs/API/classes/maplibregl.Map/), the central class of the MapLibre API, used to create a map on a page and manipulate it.

In Allmaps there are multiple classes describing maps, one for each phase a map takes through the Allmaps rendering pipeline:

*   When a Georeference Annotation is parsed, an instance of the Georeferenced Map class is created from it.
*   When this map is loaded into an application for rendering, an instance of the Warped Map class is created from it.
*   (Inside the WebGL2 rendering code, there's also a WebGL2WarpedMap)

All these map phases originating from the same Georeference Annotation have the same unique `mapId` property. This string value is used though-out Allmaps (and in the API below) to identify a map. It is returned after adding a georeference annotation to a warpedMapLayer, so you can use it later to call functions on a specific map.

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

*   [WarpedMapLayer](#warpedmaplayer)
    *   [onAdd](#onadd)
    *   [onRemove](#onremove)
    *   [addGeoreferenceAnnotation](#addgeoreferenceannotation)
    *   [removeGeoreferenceAnnotation](#removegeoreferenceannotation)
    *   [addGeoreferenceAnnotationByUrl](#addgeoreferenceannotationbyurl)
    *   [removeGeoreferenceAnnotationByUrl](#removegeoreferenceannotationbyurl)
    *   [addGeoreferencedMap](#addgeoreferencedmap)
    *   [removeGeoreferencedMap](#removegeoreferencedmap)
    *   [getWarpedMapList](#getwarpedmaplist)
    *   [getWarpedMap](#getwarpedmap)
    *   [showMap](#showmap)
    *   [showMaps](#showmaps)
    *   [hideMap](#hidemap)
    *   [hideMaps](#hidemaps)
    *   [isMapVisible](#ismapvisible)
    *   [setMapResourceMask](#setmapresourcemask)
    *   [setMapsTransformationType](#setmapstransformationtype)
    *   [getTotalBbox](#gettotalbbox)
    *   [getTotalProjectedBbox](#gettotalprojectedbbox)
    *   [bringMapsToFront](#bringmapstofront)
    *   [sendMapsToBack](#sendmapstoback)
    *   [bringMapsForward](#bringmapsforward)
    *   [sendMapsBackward](#sendmapsbackward)
    *   [getMapZIndex](#getmapzindex)
    *   [setImageInfoCache](#setimageinfocache)
    *   [getOpacity](#getopacity)
    *   [setOpacity](#setopacity)
    *   [resetOpacity](#resetopacity)
    *   [getMapOpacity](#getmapopacity)
    *   [setMapOpacity](#setmapopacity)
    *   [resetMapOpacity](#resetmapopacity)
    *   [setSaturation](#setsaturation)
    *   [resetSaturation](#resetsaturation)
    *   [setMapSaturation](#setmapsaturation)
    *   [resetMapSaturation](#resetmapsaturation)
    *   [setRemoveColor](#setremovecolor)
    *   [resetRemoveColor](#resetremovecolor)
    *   [setMapRemoveColor](#setmapremovecolor)
    *   [resetMapRemoveColor](#resetmapremovecolor)
    *   [setColorize](#setcolorize)
    *   [resetColorize](#resetcolorize)
    *   [setMapColorize](#setmapcolorize)
    *   [resetMapColorize](#resetmapcolorize)
    *   [preparerender](#preparerender)
    *   [render](#render)

### WarpedMapLayer

WarpedMapLayer class.

This class renders georeferenced maps of a IIIF Georeference Annotation on a MapLibre map.
WarpedMapLayer is implemented using MapLibre's [CustomLayerInterface](https://maplibre.org/maplibre-gl-js/docs/API/interfaces/maplibregl.CustomLayerInterface/).

#### onAdd

Method called when the layer has been added to the Map.

##### Parameters

*   `map` **[Map](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map)** The Map this custom layer was just added to.
*   `gl` **WebGL2RenderingContext** The gl context for the map.

#### onRemove

Method called when the layer has been removed from the Map.

#### addGeoreferenceAnnotation

Adds a [Georeference Annotation](https://iiif.io/api/extension/georef/).

##### Parameters

*   `annotation` **any** Georeference Annotation

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<([string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | [Error](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error))>>** the map IDs of the maps that were added, or an error per map

#### removeGeoreferenceAnnotation

Removes a [Georeference Annotation](https://iiif.io/api/extension/georef/).

##### Parameters

*   `annotation` **any** Georeference Annotation

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<([string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | [Error](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error))>>** the map IDs of the maps that were removed, or an error per map

#### addGeoreferenceAnnotationByUrl

Adds a [Georeference Annotation](https://iiif.io/api/extension/georef/) by URL.

##### Parameters

*   `annotationUrl` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Georeference Annotation

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<([string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | [Error](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error))>>** the map IDs of the maps that were added, or an error per map

#### removeGeoreferenceAnnotationByUrl

Removes a [Georeference Annotation](https://iiif.io/api/extension/georef/) by URL.

##### Parameters

*   `annotationUrl` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** Georeference Annotation

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<([string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | [Error](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error))>>** the map IDs of the maps that were removed, or an error per map

#### addGeoreferencedMap

Adds a Georeferenced map.

##### Parameters

*   `georeferencedMap` **unknown** Georeferenced map

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<([string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | [Error](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error))>** the map ID of the map that was added, or an error

#### removeGeoreferencedMap

Removes a Georeferenced map.

##### Parameters

*   `georeferencedMap` **unknown** Georeferenced map

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<([string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | [Error](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error))>** the map ID of the map that was remvoed, or an error

#### getWarpedMapList

Returns the WarpedMapList object that contains a list of the warped maps of all loaded maps

Returns **WarpedMapList** the warped map list

#### getWarpedMap

Returns a single map's warped map

##### Parameters

*   `mapId` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** ID of the map

Returns **(WarpedMap | [undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined))** the warped map

#### showMap

Make a single map visible

##### Parameters

*   `mapId` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** ID of the map

#### showMaps

Make multiple maps visible

##### Parameters

*   `mapIds` **Iterable<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** IDs of the maps

#### hideMap

Make a single map invisible

##### Parameters

*   `mapId` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** ID of the map

#### hideMaps

Make multiple maps invisible

##### Parameters

*   `mapIds` **Iterable<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** IDs of the maps

#### isMapVisible

Returns the visibility of a single map

##### Parameters

*   `mapId` &#x20;

Returns **([boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | [undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined))** whether the map is visible

#### setMapResourceMask

Sets the resource mask of a single map

##### Parameters

*   `mapId` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** ID of the map
*   `resourceMask` **Ring** new resource mask

#### setMapsTransformationType

Sets the transformation type of multiple maps

##### Parameters

*   `mapIds` **Iterable<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** IDs of the maps
*   `transformation` **TransformationType** new transformation type

#### getTotalBbox

Return the Bbox of all visible maps in the layer (inside or outside of the Viewport), in lon lat coordinates.

Returns **(Bbox | [undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined))** bbox of all warped maps

#### getTotalProjectedBbox

Return the Bbox of all visible maps in the layer (inside or outside of the Viewport), in projected coordinates.

Returns **(Bbox | [undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined))** bbox of all warped maps

#### bringMapsToFront

Bring maps to front

##### Parameters

*   `mapIds` **Iterable<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** IDs of the maps

#### sendMapsToBack

Send maps to back

##### Parameters

*   `mapIds` **Iterable<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** IDs of the maps

#### bringMapsForward

Bring maps forward

##### Parameters

*   `mapIds` **Iterable<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** IDs of the maps

#### sendMapsBackward

Send maps backward

##### Parameters

*   `mapIds` **Iterable<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** IDs of the maps

#### getMapZIndex

Returns the z-index of a single map

##### Parameters

*   `mapId` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** ID of the warped map

Returns **([number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | [undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined))** z-index of the warped map

#### setImageInfoCache

Sets the image info Cache of the warpedMapList, informing it's warped maps about possibly cached imageInfo.

##### Parameters

*   `cache` **Cache** the image info cache

#### getOpacity

Gets the opacity of the layer

Returns **([number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | [undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined))** opacity of the map

#### setOpacity

Sets the opacity of the layer

##### Parameters

*   `opacity` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** opacity between 0 and 1, where 0 is fully transparent and 1 is fully opaque

#### resetOpacity

Resets the opacity of the layer to fully opaque

#### getMapOpacity

Gets the opacity of a single map

##### Parameters

*   `mapId` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** ID of the map

Returns **([number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | [undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined))** opacity of the map

#### setMapOpacity

Sets the opacity of a single map

##### Parameters

*   `mapId` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** ID of the map
*   `opacity` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** opacity between 0 and 1, where 0 is fully transparent and 1 is fully opaque

#### resetMapOpacity

Resets the opacity of a single map to fully opaque

##### Parameters

*   `mapId` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** ID of the map

#### setSaturation

Sets the saturation of a single map

##### Parameters

*   `saturation` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** saturation between 0 and 1, where 0 is grayscale and 1 are the original colors

#### resetSaturation

Resets the saturation of a single map to the original colors

#### setMapSaturation

Sets the saturation of a single map

##### Parameters

*   `mapId` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** ID of the map
*   `saturation` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** saturation between 0 and 1, where 0 is grayscale and 1 are the original colors

#### resetMapSaturation

Resets the saturation of a single map to the original colors

##### Parameters

*   `mapId` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** ID of the map

#### setRemoveColor

Removes a color from all maps

##### Parameters

*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** remove color options

    *   `options.hexColor` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** hex color to remove
    *   `options.threshold` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)?** threshold between 0 and 1
    *   `options.hardness` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)?** hardness between 0 and 1

#### resetRemoveColor

Resets the color removal for all maps

#### setMapRemoveColor

Removes a color from a single map

##### Parameters

*   `mapId` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** ID of the map
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** remove color options

    *   `options.hexColor` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** hex color to remove
    *   `options.threshold` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)?** threshold between 0 and 1
    *   `options.hardness` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)?** hardness between 0 and 1

#### resetMapRemoveColor

Resets the color for a single map

##### Parameters

*   `mapId` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** ID of the map

#### setColorize

Sets the colorization for all maps

##### Parameters

*   `hexColor` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** desired hex color

#### resetColorize

Resets the colorization for all maps

#### setMapColorize

Sets the colorization for a single mapID of the map

##### Parameters

*   `mapId` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** ID of the map
*   `hexColor` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** desired hex color

#### resetMapColorize

Resets the colorization of a single map

##### Parameters

*   `mapId` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** ID of the map

#### preparerender

Prepare rendering the layer.

#### render

Render the layer.