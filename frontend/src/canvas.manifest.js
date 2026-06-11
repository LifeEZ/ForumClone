export const manifest = {
  screens: {
    scr_2bh4gl: { name: "Home Feed", route: "/", position: { "x": 160, "y": 220 } },
    scr_ir0byy: { name: "Community Page", route: "/r/designpatterns", position: { "x": 1560, "y": 220 } },
    scr_xvsq42: { name: "Post Detail", route: "/post/p1", position: { "x": 2960, "y": 220 } },
    scr_5knabh: { name: "Compose Post", route: "/compose", position: { "x": 160, "y": 2200 } }
  },
  sections: {
    sec_5w16b3: { name: "Feed & Content", x: 0, y: 0, width: 4320, height: 1180 },
    sec_lgv0r7: { name: "Post Creation", x: 0, y: 1980, width: 1520, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_5w16b3", children: [
    { kind: "screen", id: "scr_2bh4gl" },
    { kind: "screen", id: "scr_ir0byy" },
    { kind: "screen", id: "scr_xvsq42" }]
  },
  { kind: "section", id: "sec_lgv0r7", children: [
    { kind: "screen", id: "scr_5knabh" }]
  }]

};