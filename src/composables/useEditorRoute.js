// Gives a screen's add / edit form its own address, like the product editor:
//   <base>              the list
//   <base>/new          the add page
//   <base>/<id>/edit    the edit page
// A refresh, a shared link and the browser's back / forward buttons land on the same page.
//
// The screen keeps its own state and functions; this only keeps them and the address in step:
//   isOpen     ref: the form is showing
//   editId     ref / getter: the id being edited (empty when adding)
//   openAdd(query)  shows an empty form; query is the address's ?… (e.g. ?parent=3 for a sub-category)
//   addQuery() optional: the ?… the add page's address carries, so a refresh opens the same form
//   openEdit(item) shows the form for one item
//   close()    hides the form
//   findItem(id) resolves the item to edit (from the loaded list, or fetched), or null when there is none
//   notFound() optional: tells the admin the item does not exist
//   listPath   optional: the list's address when the form lives below it (e.g. base /admin/attributes/values,
//              list /admin/attributes); defaults to base
//   viewId / openView(item)  optional: a read-only page of one item at <base>/<id>
// openAdd may return false (e.g. the ?attribute= it needs does not exist): the address goes back to the list.
import { unref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function useEditorRoute({ base, isOpen, editId, openAdd, openEdit, close, findItem, notFound, addQuery, listPath, viewId, openView }) {
  const route = useRoute();
  const router = useRouter();
  const list = listPath || base;

  const idText = (source) => {
    const value = typeof source === 'function' ? source() : unref(source);
    return value === undefined || value === null || value === '' ? '' : String(value);
  };
  const currentEditId = () => idText(editId);
  const currentViewId = () => (viewId ? idText(viewId) : '');
  const onThisScreen = () => route.path === list || route.path.startsWith(`${list}/`);
  const queryForAdd = () => {
    const query = addQuery ? addQuery() || {} : {};
    return Object.fromEntries(Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)]));
  };
  const stateLocation = () => {
    if (!isOpen.value) return { path: list, query: {} };
    const shown = currentViewId();
    if (shown) return { path: `${base}/${encodeURIComponent(shown)}`, query: {} };
    const id = currentEditId();
    return id ? { path: `${base}/${encodeURIComponent(id)}/edit`, query: {} } : { path: `${base}/new`, query: queryForAdd() };
  };
  const sameQuery = (a, b) => {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].every((key) => String(a[key] ?? '') === String(b[key] ?? ''));
  };

  // Opening / closing the form on the page updates the address.
  watch(() => [isOpen.value, currentEditId(), currentViewId(), JSON.stringify(queryForAdd())], ([open], [wasOpen]) => {
    if (!onThisScreen()) return; // the screen is kept alive in the background
    // A form that is still loading (closed, with its id already set) leaves the address alone.
    if (!open && !wasOpen) return;
    const target = stateLocation();
    if (route.path === target.path && (target.path === list || sameQuery(route.query, target.query))) return;
    router.push(target);
  });

  // The address opens the matching form.
  const openFromRoute = async () => {
    if (!onThisScreen()) return;
    if (route.path.replace(/\/$/, '') === list) {
      if (isOpen.value) close();
      return;
    }
    if (route.path !== base && !route.path.startsWith(`${base}/`)) return; // another form of the same screen
    const rest = route.path.slice(base.length).replace(/\/$/, '');
    if (rest === '/new') {
      if (isOpen.value && !currentEditId() && !currentViewId()) return;
      const opened = await openAdd(route.query);
      if (opened === false) router.replace(list);
      return;
    }
    const editMatch = rest.match(/^\/([^/]+)\/edit$/);
    const viewMatch = openView ? rest.match(/^\/([^/]+)$/) : null;
    if (!editMatch && !viewMatch) return;
    const id = decodeURIComponent((editMatch || viewMatch)[1]);
    if (isOpen.value && (editMatch ? currentEditId() === id && !currentViewId() : currentViewId() === id)) return;
    let item = null;
    try { item = await findItem(id); } catch { item = null; }
    if (route.path.slice(base.length).replace(/\/$/, '') !== rest) return; // the admin moved on while it loaded
    if (item) (editMatch ? openEdit : openView)(item);
    else {
      if (notFound) notFound();
      router.replace(list);
    }
  };

  watch(() => route.fullPath, openFromRoute, { immediate: true });

  return { openFromRoute };
}

/**
 * The routes of one screen: list, add, edit (and, with { view: true }, a read-only page at <path>/:id).
 * They share one cached page (meta.pagePath).
 */
export const editorRoutes = (path, name, component, { view = false } = {}) => {
  const meta = { pagePath: `/admin/${path}` };
  return [
    { path, name, component, meta },
    { path: `${path}/new`, name: `${name}New`, component, meta },
    { path: `${path}/:id/edit`, name: `${name}Edit`, component, meta },
    ...(view ? [{ path: `${path}/:id`, name: `${name}View`, component, meta }] : []),
  ];
};
