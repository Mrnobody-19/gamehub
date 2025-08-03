import * as React from "react";
import Svg, { Path } from "react-native-svg";

const Cart = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={24}
    height={24}
    color="#000000"
    fill="none"
    {...props}
  >
    <Path
      d="M3 3H5L6.68 14.39C6.80706 15.2963 7.54734 16 8.45999 16H18.5C19.3284 16 20 15.3284 20 14.5C20 13.7675 19.4712 13.1417 18.7526 13.012L7.13 11"
      stroke="currentColor"
      strokeWidth={props.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 21C8.55228 21 9 20.5523 9 20C9 19.4477 8.55228 19 8 19C7.44772 19 7 19.4477 7 20C7 20.5523 7.44772 21 8 21Z"
      stroke="currentColor"
      strokeWidth={props.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17 21C17.5523 21 18 20.5523 18 20C18 19.4477 17.5523 19 17 19C16.4477 19 16 19.4477 16 20C16 20.5523 16.4477 21 17 21Z"
      stroke="currentColor"
      strokeWidth={props.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default Cart;
