import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const FAVICON_SETS = {
  english: [
    { id: "favicon-logo", size: "any", href: "/favicons/zayd-logo.png" },
  ],
} as const;

type FaviconSetKey = keyof typeof FAVICON_SETS;

const ensureFaviconLink = (id: string) => {
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = id;
    link.rel = "icon";
    link.type = "image/png";
    document.head.appendChild(link);
  }
  return link;
};

const applyFaviconSet = (setKey: FaviconSetKey) => {
  FAVICON_SETS[setKey].forEach(({ id, size, href }) => {
    const link = ensureFaviconLink(id);
    link.sizes = size;
    link.href = href;
  });
};

const FaviconManager = () => {
  const location = useLocation();

  useEffect(() => {
    applyFaviconSet("english");
  }, [location.pathname]);

  return null;
};

export default FaviconManager;
