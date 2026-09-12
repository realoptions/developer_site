import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import apiSpec from "../swagger_spec.json";

/** The OpenAPI browser. The spec is generated at build time (see `npm run spec`). */
const ApiDocs = () => (
  <SwaggerUI
    spec={apiSpec}
    supportedSubmitMethods={["get", "put", "post", "delete"]}
    docExpansion="list"
  />
);

export default ApiDocs;
