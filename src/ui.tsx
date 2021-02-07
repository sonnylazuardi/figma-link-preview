import * as React from "react";
import * as ReactDOM from "react-dom";
import { getFigmaFile } from "./api";
import { eventHandler, setEventCallback } from "./eventHandler";
import "./ui.css";

interface Link {
  id: string;
  link: string;
  mixed?: boolean;
}

const WINDOW_HEIGHT = 632;
const WINDOW_WIDTH_SMALL = 340;
const WINDOW_WIDTH_BIG = 960;

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

  React.useEffect(() => {
    linksRefValue.current = links;
  }, [links]);

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
    eventHandler.setWindowSize(340, WINDOW_HEIGHT);
    setRoute("preview");
    setFileKey(fileKey);
    setLoading(false);
  };

  React.useEffect(() => {
    setEventCallback("selectionChanged", async () => {
      if (linksRefValue.current) {
        const links: any = linksRefValue.current;
        const nodes = await eventHandler.getSelections();
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

  const downloadIcon = () => {
    return (
      <svg
        width="27"
        height="27"
        viewBox="0 0 27 27"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.38245 8.25827C8.84608 8.25827 9.22193 8.63412 9.22193 9.09775C9.22193 9.52275 8.90611 9.87398 8.49636 9.92957L8.38245 9.93723H7.32806C5.5849 9.93723 4.15925 11.3001 4.05964 13.0178L4.05408 13.2101V18.6779C4.05408 20.4273 5.4219 21.8576 7.14625 21.9575L7.33926 21.9631H19.8084C21.5523 21.9631 22.9772 20.6005 23.0768 18.8815L23.0823 18.6891V13.2224C23.0823 11.4721 21.7157 10.0427 19.9913 9.94281L19.7983 9.93723H18.754C18.2903 9.93723 17.9145 9.56138 17.9145 9.09775C17.9145 8.67275 18.2303 8.32152 18.6401 8.26593L18.754 8.25827H19.7983C22.4616 8.25827 24.6339 10.3549 24.7559 12.9887L24.7613 13.2224V18.6891C24.7613 21.3468 22.6691 23.5149 20.0415 23.6367L19.8084 23.642H7.33926C4.67616 23.642 2.50256 21.5445 2.38053 18.9116L2.37512 18.6779V13.2101C2.37512 10.556 4.46465 8.38914 7.08814 8.26398L7.32806 8.25827H8.38245ZM13.5684 2.96069C13.9934 2.96069 14.3447 3.27651 14.4002 3.68626L14.4079 3.80017L14.4077 15.244L16.2375 13.4084C16.5349 13.1097 17.0013 13.0817 17.3304 13.3249L17.4247 13.4059C17.7234 13.7034 17.7514 14.1697 17.5082 14.4988L17.4272 14.5932L14.1633 17.8705C14.1358 17.8976 14.1078 17.9222 14.0782 17.9448L14.1633 17.8705C14.1221 17.9118 14.0777 17.948 14.0308 17.979C14.0138 17.9898 13.9961 18.0006 13.9779 18.0108C13.9665 18.0176 13.9549 18.0237 13.9433 18.0295C13.92 18.0408 13.8959 18.0514 13.8713 18.061C13.8585 18.0662 13.8459 18.0707 13.8331 18.075C13.8098 18.0824 13.7856 18.0893 13.7609 18.0951C13.7475 18.0985 13.7345 18.1012 13.7214 18.1036C13.7001 18.1073 13.678 18.1105 13.6557 18.1128C13.6329 18.1154 13.6105 18.1168 13.588 18.1174C13.5814 18.1172 13.5749 18.1172 13.5684 18.1172L13.55 18.1174C13.5271 18.1169 13.5043 18.1155 13.4816 18.1131L13.5684 18.1172C13.516 18.1172 13.4647 18.1124 13.4149 18.1032C13.4023 18.1012 13.3892 18.0984 13.3761 18.0954C13.3504 18.0891 13.3252 18.0819 13.3006 18.0736C13.289 18.07 13.2774 18.0658 13.2659 18.0614C13.2421 18.0519 13.2189 18.0417 13.1962 18.0304C13.1839 18.0247 13.1713 18.0181 13.1588 18.0111C13.1367 17.9983 13.1153 17.985 13.0946 17.9708C13.0853 17.9649 13.0766 17.9586 13.0679 17.9522C13.0318 17.9245 13.0024 17.8989 12.9748 17.8714L12.9736 17.8705L9.70971 14.5932C9.38254 14.2646 9.38363 13.7331 9.71214 13.4059C10.0108 13.1085 10.4772 13.0824 10.8054 13.3269L10.8993 13.4084L12.7287 15.244L12.7289 3.80017C12.7289 3.33654 13.1048 2.96069 13.5684 2.96069Z"
          fill="#200E32"
        />
      </svg>
    );
  };

  const desktopIcon = () => {
    return (
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M15.7048 3.0479C16.1397 3.0479 16.4922 3.39931 16.4922 3.83279C16.4922 4.23014 16.196 4.55853 15.8117 4.61051L15.7048 4.61767H8.07544C5.4986 4.61767 3.84089 6.3188 3.74561 8.97239L3.74127 9.21622V17.6745C3.74127 20.3981 5.29857 22.1578 7.84156 22.2589L8.07544 22.2635H17.1077C19.6868 22.2635 21.3424 20.569 21.4376 17.9181L21.4419 17.6745V10.3082C21.4419 9.87476 21.7944 9.52335 22.2292 9.52335C22.6278 9.52335 22.9572 9.81863 23.0094 10.2017L23.0165 10.3082V17.6745C23.0165 21.2226 20.7697 23.7152 17.3537 23.8292L17.1077 23.8333H8.07544C4.5791 23.8333 2.27564 21.4367 2.17039 17.9271L2.16663 17.6745V9.21622C2.16663 5.66647 4.41477 3.16636 7.82956 3.05199L8.07544 3.0479H15.7048ZM17.9263 10.1955C18.2387 10.4369 18.319 10.8662 18.1309 11.1998L18.0664 11.2967L14.9916 15.2528C14.7483 15.5658 14.315 15.6449 13.9801 15.4545L13.8829 15.3893L10.9237 13.0723L8.26704 16.5151C8.02599 16.8275 7.59554 16.9089 7.26035 16.7226L7.16294 16.6586C6.84964 16.4183 6.76792 15.9892 6.95487 15.655L7.01905 15.5579L10.1611 11.4868C10.4039 11.1723 10.8383 11.0922 11.174 11.2828L11.2715 11.3482L14.2315 13.6667L16.8217 10.3352C17.088 9.99254 17.5825 9.92999 17.9263 10.1955ZM21.0281 2.16663C22.5774 2.16663 23.8333 3.41866 23.8333 4.96312C23.8333 6.50758 22.5774 7.75961 21.0281 7.75961C19.4789 7.75961 18.2229 6.50758 18.2229 4.96312C18.2229 3.41866 19.4789 2.16663 21.0281 2.16663ZM21.0281 3.7364C20.3485 3.7364 19.7976 4.28562 19.7976 4.96312C19.7976 5.64062 20.3485 6.18984 21.0281 6.18984C21.7077 6.18984 22.2586 5.64062 22.2586 4.96312C22.2586 4.28562 21.7077 3.7364 21.0281 3.7364Z"
          fill="#200E32"
        />
      </svg>
    );
  };

  const renderPreview = () => {
    return (
      <div>
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
        <div style={{ height: WINDOW_HEIGHT - 64 }}>
          {activeLink ? (
            <div
              dangerouslySetInnerHTML={{
                __html: `<iframe is="x-frame-bypass" width="${
                  isDesktop ? WINDOW_WIDTH_BIG : WINDOW_WIDTH_SMALL
                }" height="${WINDOW_HEIGHT - 64}" src=${
                  activeLink.link
                } sandbox="" style="border:none;" />`,
              }}
            />
          ) : (
            <div style={{ padding: 20 }}>Select text or frame with a link</div>
          )}
        </div>
        <div className="menu-bar">
          <div
            className="button"
            onClick={() => {
              loadFile(fileKey);
            }}
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            {downloadIcon()}
          </div>
          <div
            className="button"
            onClick={() => {
              setIsDesktop((v) => {
                const newV = !v;
                if (newV) {
                  eventHandler.setWindowSize(WINDOW_WIDTH_BIG, WINDOW_HEIGHT);
                } else {
                  eventHandler.setWindowSize(WINDOW_WIDTH_SMALL, WINDOW_HEIGHT);
                }
                return newV;
              });
            }}
            style={{ opacity: isDesktop ? 0.5 : 1 }}
          >
            {desktopIcon()}
          </div>
        </div>
      </div>
    );
  };

  if (route === "preview") return renderPreview();
  return renderHome();
};

ReactDOM.render(<App />, document.getElementById("react-page"));
