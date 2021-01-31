/// <reference path="../node_modules/@figma/plugin-typings/index.d.ts" />

import * as api from './eventHandler'

figma.showUI(__html__);

figma.on("selectionchange", () => {
  api.uiApi.selectionChanged(figma.currentPage.selection);
});

figma.on("currentpagechange", () => {
  api.uiApi.pageChanged(figma.currentPage);
});