import { createPluginAPI, createUIAPI } from "figma-jsonrpc";

let nodes = [];

const traverseNode = (node: any) => {
  if (node.children) {
    node.children.forEach((nodeChild) => traverseNode(nodeChild));
  }
  nodes.push(node.id);
};

export const eventHandler = createPluginAPI({
  getCommand() {
    return figma.command;
  },
  setStorage(key: string, value: string) {
    return figma.clientStorage.setAsync(key, value);
  },
  setWindowSize(width: number, height: number) {
    return figma.ui.resize(width, height);
  },
  notify(message: string) {
    figma.notify(message);
  },
  placeSvg(svg: any) {
    const page = figma.currentPage;
    let node = figma.createNodeFromSvg(svg);
    if (!node) {
      console.log("Import failed: invalid SVG");
      return;
    }
    page.appendChild(node);
  },
  addRelaunch(fileKey: string) {
    let node = figma.currentPage;
    if (!node) {
      figma.notify("Please select frame");
      return;
    }
    figma.root.setPluginData("fileKey", fileKey);
    node.setRelaunchData({ relaunch: "" });
  },
  getRelaunch() {
    return figma.root.getPluginData("fileKey");
  },
  getSelections() {
    nodes = [];
    const select = figma.currentPage.selection[0];
    if (select) {
      traverseNode(select);
    }
    return nodes;
  },
});

let eventCallback = {
  selectionChanged: (selection) => {},
  pageChanged: (page) => {},
};

export const setEventCallback = (name: string, callback: Function) => {
  eventCallback[name] = callback;
};

export const uiApi = createUIAPI({
  selectionChanged(selection) {
    nodes = [];
    eventCallback.selectionChanged(selection.map((item) => item.id));
  },
  pageChanged(page) {
    eventCallback.pageChanged(page);
  },
});
