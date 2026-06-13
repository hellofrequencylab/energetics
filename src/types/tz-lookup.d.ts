declare module "tz-lookup" {
  /** Returns the IANA timezone id for a coordinate. */
  const tzlookup: (latitude: number, longitude: number) => string;
  export default tzlookup;
}
