import { useEffect } from "react";
import { useStore } from "./StoreProvider";
import { useI18n } from "../i18n/Provider";
interface ToolContext {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
}
export function WebMCP() {
  const { products } = useStore();
  const { local } = useI18n();
  useEffect(() => {
    const context = (document as Document & { modelContext?: ToolContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "search_incubator_catalog",
            description:
              "Search the published catalog. Read-only; does not place orders or change the cart. Prices are in integer TJS minor units.",
            inputSchema: {
              type: "object",
              properties: { query: { type: "string", maxLength: 100 } },
              required: ["query"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute(input: unknown) {
              if (
                !input ||
                typeof input !== "object" ||
                !("query" in input) ||
                typeof input.query !== "string" ||
                input.query.length > 100
              )
                throw new Error("Invalid query");
              const query = input.query.toLowerCase();
              return products
                .filter((p) =>
                  (local(p.name) + " " + p.capacity)
                    .toLowerCase()
                    .includes(query),
                )
                .slice(0, 20)
                .map((p) => ({
                  id: p.id,
                  name: local(p.name),
                  capacity: p.capacity,
                  price_minor: p.price_minor,
                  stock: p.stock,
                }));
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {
      /* Unsupported experimental registry must not break the shop. */
    }
    return () => lifecycle.abort();
  }, [products, local]);
  return null;
}
