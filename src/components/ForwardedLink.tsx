import * as React from "react";
import { Link, LinkProps } from "react-router-dom";

/**
 * A ref-forwarding wrapper around react-router-dom's Link.
 * Use this when placing a Link inside Radix `asChild` components
 * to avoid the "Function components cannot be given refs" warning.
 */
const ForwardedLink = React.forwardRef<HTMLAnchorElement, LinkProps>(
  (props, ref) => <Link ref={ref} {...props} />
);
ForwardedLink.displayName = "ForwardedLink";

export { ForwardedLink };
