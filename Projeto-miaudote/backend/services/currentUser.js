export function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
        return null;
    }
}

export function getUserId() {
    const u = getCurrentUser();
    return u?._id || u?.id || null;
}