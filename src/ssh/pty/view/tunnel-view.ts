export interface TunnelView {
  title();

  render();

  on(event: "update", listener: () => void);
}
