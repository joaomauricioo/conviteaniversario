const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

type ApiError = {
  mensagem?: string;
};

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, options);
  const data = (await response.json().catch(() => ({}))) as T & ApiError;

  if (!response.ok) {
    throw new Error(data.mensagem ?? "Nao foi possivel comunicar com a API.");
  }

  return data;
}
