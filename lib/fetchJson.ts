export const fetchJson = async <T>(url: string, token: string): Promise<T> => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const contentType = res.headers.get("content-type");

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fetch error: ${res.status} ${res.statusText} - ${text}`);
  }

  if (contentType && contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  } else {
    const text = await res.text();
    throw new Error(`Expected JSON but got: ${text.slice(0, 200)}...`);
  }
};
