// 0555: where a page's link to a stylesheet sits: in the head, before </head>.
export const SETTINGS_LINK = '<link rel="stylesheet" href="panel-settings.css">';

// True when the page has the link, and it comes before the head's end.
export function linkedInHead(html, link) {
  const at = html.indexOf(link);
  const end = html.indexOf('</head>');
  return at !== -1 && end !== -1 && at < end;
}
