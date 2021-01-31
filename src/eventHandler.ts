import { createPluginAPI, createUIAPI } from "figma-jsonrpc";

export const eventHandler = createPluginAPI({
  getCommand() {
    return figma.command;
  },
  setStorage(key: string, value: string) {
    return figma.clientStorage.setAsync(key, value);
  },
  setWindowSize(width: number, height: number) {
    return figma.ui.resize(width, height)
  },
  placeSvg(svg: any) {
    const page = figma.currentPage;
    let node = figma.createNodeFromSvg(svg);
    if (!node) {
      console.log('Import failed: invalid SVG');
      return;
    }
    page.appendChild(node)
  },
  createRectangles(count: number) {
    const nodes = [];

    for (let i = 0; i < count; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 150;
      rect.fills = [{ type: "SOLID", color: { r: 1, g: 0.5, b: 0 } }];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }

    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }
})

let eventCallback = {
  selectionChanged: (selection) => { },
  pageChanged: (page) => { }
}

export const setEventCallback = (name: string, callback: Function) => {
  eventCallback[name] = callback;
}

export const uiApi = createUIAPI({
  selectionChanged(selection) {
    eventCallback.selectionChanged(selection.map((item) => item.id))
  },
  pageChanged(page) {
    eventCallback.pageChanged(page)
  }
});