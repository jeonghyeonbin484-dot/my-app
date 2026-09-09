export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { loadLocalEnvIntoProcess } = await import("./lib/env");
  loadLocalEnvIntoProcess();
}
