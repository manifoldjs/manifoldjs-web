import { FastifyInstance } from "fastify";
import JSZip from "jszip";
import { handleImages } from "./images";
import {
  FilesAndEdit,
  copyFiles,
  copyFile,
} from "./copy";
import { webAppManifestSchema } from "./schema";

function schema(server: FastifyInstance) {
  return {
    querystring: {
      type: "object",
      properties: {
        siteUrl: { type: "string" },
        hasServiceWorker: { type: "boolean" },
      },
    },
    body: webAppManifestSchema(server),
    response: {
      // 200 response is file a so no json schema
      400: {
        type: "object",
        properties: {
          message: { type: "string" },
          errMessage: { type: "string" },
        },
      },
    },
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function web(server: FastifyInstance) {
  return server.route({
    method: "POST",
    url: "/",
    schema: schema(server),
    handler: async function (request, reply) {
      try {
        const zip = new JSZip();
        const siteUrl = (request.query as WebQuery).siteUrl as string;
        const hasServiceWorker = (request.query as WebQuery).hasServiceWorker;
        const manifest = request.body as WebAppManifest;

        // TODO change the boilerplate here
        const results = await Promise.all([
          ...(await handleImages(server, zip, manifest, siteUrl, "ios")),
          ...copyFiles(zip, manifest, filesAndEdits),
          ...(await handleServiceWorker(zip, manifest, hasServiceWorker)),
        ]);

        const errors = results.filter((result) => !result.success);
        if (errors.length > 0) {
          throw Error(errors.map((result) => result.filePath).toString());
        }

        // Send Stream
        reply
          .type("application/zip")
          .send(await zip.generateAsync({ type: "nodebuffer" }));
      } catch (err) {
        server.log.error(err);

        reply.status(400).send({
          message: "failed to create your macos project",
          errMessage: err.message,
        });
      }
    },
  });
}

// Object that holds the files and edit functions to those files.
const filesAndEdits: FilesAndEdit = {
  "web/next-steps.md": copyFile,
  "manifest.json": async (zip, manifest, filePath) => {
    try {
      zip.file(filePath, JSON.stringify(manifest, undefined, 2));
      return {
        filePath,
        success: true,
      };
    } catch (error) {
      return {
        filePath,
        success: false,
        error,
      };
    }
  },
};

// Fetches service worker, if the service worker exists in the repo, skip this step.
async function handleServiceWorker(zip: JSZip, manifest: WebAppManifest, hasServiceWorker = false): Promise<Array<OperationResult>> {
  try {
    if (!hasServiceWorker) {
      const response = await fetch("", {

      })

      // response.
        


      return [{
        filePath: "serviceWorker.js",
        success: true
      }, {
        filePath: "serviceWorker-register.js",
        success: true
      }];
    }

    return [];
  } catch (error) {
    return [{
      filePath: "serviceWorker.js",
      success: false,
      error
    }, {
      filePath: "serviceWorker-register.js",
      success: false,
      error
    }];
  }
}