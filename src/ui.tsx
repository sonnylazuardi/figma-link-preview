import * as React from "react";
import * as ReactDOM from "react-dom";
import { getFigmaFile } from "./api";
import { eventHandler, setEventCallback } from "./eventHandler";
import "./ui.css";
import { useWindowResize } from "./useWindowResize";

interface Link {
  id: string;
  link: string;
  mixed?: boolean;
}

const WINDOW_HEIGHT = 632;

const traverseNode = (node: any, setLinks: any) => {
  if (node.children) {
    node.children.forEach((nodeChild) => traverseNode(nodeChild, setLinks));
  }
  const currentLink = node.style?.hyperlink?.url;
  if (currentLink) {
    setLinks((v) => [...v, { id: node.id, link: currentLink }]);
  }
  const currentMixedLink = Object.keys(node.styleOverrideTable || {});
  if (currentMixedLink.length) {
    currentMixedLink.forEach((item) => {
      const currentLink = node.styleOverrideTable[item].hyperlink?.url;
      if (currentLink) {
        setLinks((v) => [
          ...v,
          { id: node.id, link: currentLink, mixed: true },
        ]);
      }
    });
  }
};

const App = () => {
  const [route, setRoute] = React.useState("home");
  const [loading, setLoading] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [fileKey, setFileKey] = React.useState("");
  const [links, setLinks] = React.useState<Link[]>([]);
  const [currentUrl, setCurrentUrl] = React.useState("");
  const [activeLink, setActiveLink] = React.useState<Link | null>(null);
  const linksRefValue = React.useRef(links);
  const fileKeyRefValue = React.useRef(fileKey);

  function onWindowResize(windowSize: { width: number; height: number }) {
    eventHandler.setWindowSize(windowSize.width, windowSize.height);
  }
  useWindowResize(onWindowResize, {
    minWidth: 120,
    minHeight: 120,
    maxWidth: 1024,
    maxHeight: 1024,
  });

  React.useEffect(() => {
    linksRefValue.current = links;
  }, [links]);

  React.useEffect(() => {
    fileKeyRefValue.current = fileKey;
  }, [fileKey]);

  let textbox: HTMLInputElement = null;

  const textboxRef = (element: HTMLInputElement) => {
    if (element) element.value = "";
    textbox = element;
  };

  const loadFile = async (fileKey: string) => {
    setLoading(true);
    const result = await getFigmaFile(fileKey);
    setLinks([]);
    traverseNode(result.document, setLinks);
    setRoute("preview");
    setFileKey(fileKey);
    setLoading(false);

    const links: any = linksRefValue.current;
    const nodes: any = await eventHandler.getSelections();
    const currentLink: Link = links.find((link) => nodes.includes(link.id));

    if (currentLink) {
      setActiveLink(currentLink);
      setCurrentUrl(currentLink.link);
    } else {
      setActiveLink(null);
      setCurrentUrl("");
    }
  };

  React.useEffect(() => {
    setEventCallback("selectionChanged", async () => {
      if (linksRefValue.current) {
        const links: any = linksRefValue.current;
        const nodes: any = await eventHandler.getSelections();
        if (nodes.length > 0) {
          loadFile(fileKeyRefValue.current);
        }

        const currentLink: Link = links.find((link) => nodes.includes(link.id));

        if (currentLink) {
          setActiveLink(currentLink);
          setCurrentUrl(currentLink.link);
        } else {
          setActiveLink(null);
          setCurrentUrl("");
        }
      }
    });
    const load = async () => {
      eventHandler.setWindowSize(345, WINDOW_HEIGHT);
      const fileKey = await eventHandler.getRelaunch();
      if (fileKey) {
        eventHandler.addRelaunch(fileKey);
        loadFile(fileKey);
      }
    };
    load();
  }, []);

  const onCreate = async () => {
    setLoading(true);
    const figmaUrl = textbox.value;
    const parseId = figmaUrl.match(/\/file\/(.*?)\//);
    if (parseId && parseId[1]) {
      const fileKey = parseId[1];

      const result = await getFigmaFile(fileKey);
      if (result) {
        eventHandler.addRelaunch(fileKey);
        loadFile(fileKey);
      } else {
        eventHandler.notify("File not found");
      }
      setLoading(false);
    } else {
      eventHandler.notify("Please input valid figma url");
    }
    setLoading(false);
  };

  const renderHome = () => {
    return (
      <div style={{ padding: 20 }}>
        <div>
          <b>Share → Copy link</b> in the top right
        </div>
        <p>
          <input
            className="url-input"
            ref={textboxRef}
            placeholder="Paste your figma URL here..."
          />
        </p>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <button id="create" onClick={() => onCreate()}>
            Link Preview
          </button>
        )}
      </div>
    );
  };

  const renderPreview = () => {
    return (
      <div style={{ padding: 2, overflow: "hidden" }}>
        <div className="url-bar">
          <input
            type="text"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setActiveLink({ link: currentUrl, id: "" });
              }
            }}
            placeholder="Type a URL..."
            className="url-input"
          ></input>
        </div>
        <div style={{ width: "100%", height: "calc(100vh - 45px)" }}>
          {activeLink ? (
            <div
              dangerouslySetInnerHTML={{
                __html: `<iframe is="x-frame-bypass" width="100%" height="100%" src=${activeLink.link} sandbox="" style="border:none;" />`,
              }}
            />
          ) : (
            <div style={{ padding: 20 }}>Select text or frame with a link</div>
          )}
        </div>
      </div>
    );
  };

  if (route === "preview") return renderPreview();
  return renderHome();
};

ReactDOM.render(<App />, document.getElementById("react-page"));
