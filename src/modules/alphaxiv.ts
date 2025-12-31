import { getLocaleID, getString } from "../utils/locale";

const ARXIV_HOST_PATTERN = /arxiv\.org/i;
const ARXIV_ABS_PATTERN =
  /arxiv\.org\/(?:abs|pdf)\/([^?#]+?)(?:\.pdf)?(?:[?#].*)?$/i;
const ARXIV_ID_PATTERN =
  /\b([0-9]{4}\.[0-9]{4,5}(?:v\d+)?|[a-z-]+\/\d{7}(?:v\d+)?)\b/i;

function normalizeArxivId(rawId: string): string | null {
  const cleaned = rawId.replace(/\.pdf$/i, "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function extractArxivIdFromUrl(url?: string | null): string | null {
  if (!url || !ARXIV_HOST_PATTERN.test(url)) {
    return null;
  }
  const match = url.match(ARXIV_ABS_PATTERN);
  if (!match) {
    return null;
  }
  return normalizeArxivId(match[1]);
}

function extractArxivIdFromExtra(extra?: string | null): string | null {
  if (!extra) {
    return null;
  }
  const match = extra.match(ARXIV_ID_PATTERN);
  if (!match) {
    return null;
  }
  return normalizeArxivId(match[1]);
}

function getAlphaXivUrl(item: Zotero.Item): string | null {
  const url = item.getField("url") as string | null;
  const extra = item.getField("extra") as string | null;
  const arxivId = extractArxivIdFromUrl(url) || extractArxivIdFromExtra(extra);
  if (!arxivId) {
    return null;
  }
  return `https://www.alphaxiv.org/abs/${arxivId}`;
}

export class AlphaXivFactory {
  static registerItemPaneSection() {
    Zotero.ItemPaneManager.registerSection({
      paneID: "alphaxiv",
      pluginID: addon.data.config.addonID,
      header: {
        l10nID: getLocaleID("item-section-alphaxiv-head-text"),
        icon: "chrome://zotero/skin/16/universal/document.svg",
      },
      sidenav: {
        l10nID: getLocaleID("item-section-alphaxiv-sidenav-tooltip"),
        icon: "chrome://zotero/skin/20/universal/link.svg",
      },
      onItemChange: ({ item, setEnabled }) => {
        const alphaxivUrl = item ? getAlphaXivUrl(item) : null;
        setEnabled(Boolean(alphaxivUrl));
        return true;
      },
      onRender: ({ body, item }) => {
        body.replaceChildren();
        if (!item) {
          return;
        }
        const alphaxivUrl = getAlphaXivUrl(item);
        const doc = body.ownerDocument;
        if (!doc) {
          return;
        }
        if (!alphaxivUrl) {
          const emptyMessage = ztoolkit.UI.createElement(doc, "p", {
            namespace: "html",
            textContent: getString("item-section-alphaxiv-empty"),
          });
          body.appendChild(emptyMessage);
          return;
        }

        const description = ztoolkit.UI.createElement(doc, "p", {
          namespace: "html",
          textContent: getString("item-section-alphaxiv-link-label"),
        });
        const link = ztoolkit.UI.createElement(doc, "a", {
          namespace: "html",
          properties: {
            href: alphaxivUrl,
            textContent: alphaxivUrl,
          },
        });
        link.addEventListener("click", (event) => {
          event.preventDefault();
          Zotero.launchURL(alphaxivUrl);
        });

        body.appendChild(description);
        body.appendChild(link);
      },
    });
  }
}
