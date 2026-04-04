export function getStoredAuth() {
  const userId = sessionStorage.getItem("userId") || localStorage.getItem("userId") || "";
  const role = sessionStorage.getItem("role") || localStorage.getItem("role") || "";
  const name = sessionStorage.getItem("name") || localStorage.getItem("name") || "";

  return {
    userId,
    role,
    name,
  };
}

export function setStoredAuth({ userId, role, name }) {
  if (userId) {
    sessionStorage.setItem("userId", userId);
    localStorage.setItem("userId", userId);
  }

  if (role) {
    sessionStorage.setItem("role", role);
    localStorage.setItem("role", role);
  }

  if (name) {
    sessionStorage.setItem("name", name);
    localStorage.setItem("name", name);
  }
}

export function setStoredName(name) {
  if (!name) {
    return;
  }

  sessionStorage.setItem("name", name);
  localStorage.setItem("name", name);
}

export function clearStoredAuth() {
  sessionStorage.removeItem("userId");
  sessionStorage.removeItem("role");
  sessionStorage.removeItem("name");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
}
