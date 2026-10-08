/**
 * The app: reads the index, then shows the view the route names.
 */
import { useEffect } from 'preact/hooks';
import type { StoreIndex } from '../format/store.ts';
import { Footer, Header } from './components/layout.tsx';
import { Empty, Failure, Loading } from './components/states.tsx';
import { useResource } from './hooks/use-resource.ts';
import { replaceRoute, useRoute } from './hooks/use-route.ts';
import { brandingOf, loadBranding, loadIndex, MissingFileError } from './lib/data.ts';
import type { Route } from './lib/route.ts';
import { redirectOf } from './lib/route.ts';
import { CaseView } from './views/case.tsx';
import { Compare } from './views/compare.tsx';
import { NotFound } from './views/not-found.tsx';
import { Results } from './views/results.tsx';
import { RunView } from './views/run.tsx';
import { Runs } from './views/runs.tsx';
import { TrialView } from './views/trial.tsx';

/**
 * The app.
 *
 * @returns The page.
 */
export function App() {
  const { route, hash } = useRoute();
  const resource = useResource('index', loadIndex);
  const index = resource.state === 'ready' ? resource.value : undefined;
  const loaded = useResource('branding', loadBranding);
  const branding = loaded.state === 'ready' ? loaded.value : brandingOf(undefined);
  useEffect(() => {
    document.title = branding.title;
  }, [branding.title]);
  // An address of an earlier dashboard goes to where its view lives now.
  const redirect = redirectOf(hash);
  useEffect(() => {
    if (redirect !== undefined) replaceRoute(redirect);
  }, [redirect]);
  // A new view starts at the top; a filter change keeps the place.
  const path = hash.split('?')[0];
  useEffect(() => {
    if (path !== undefined) scrollTo(0, 0);
  }, [path]);
  return (
    <>
      <Header branding={branding} route={route} />
      <main class="main" id="main">
        {resource.state === 'loading' ? <Loading what="runs" /> : null}
        {resource.state === 'error' ? <IndexFailure error={resource.error} /> : null}
        {index === undefined || redirect !== undefined ? null : (
          <View index={index} route={route} hash={hash} />
        )}
      </main>
      <Footer />
    </>
  );
}

/**
 * What the page shows when the index cannot be read.
 *
 * @param props - The error.
 * @returns The message.
 */
function IndexFailure(props: { readonly error: Error }) {
  if (!(props.error instanceof MissingFileError))
    return <Failure error={props.error} what="index" />;
  return (
    <Empty title="No runs recorded yet.">
      <p>
        The action writes <span class="mono">data/index.json</span> next to this page on its first
        run. Run the workflow once, then reload.
      </p>
    </Empty>
  );
}

/**
 * The view the route names.
 *
 * @param props - The index, the route and the hash.
 * @returns The view.
 */
function View(props: { readonly index: StoreIndex; readonly route: Route; readonly hash: string }) {
  const { index, route, hash } = props;
  if (index.runs.length === 0 && route.view !== 'not-found') {
    return (
      <Empty title="No runs recorded yet.">
        The index is there, but it lists no run. Retention may have removed them all.
      </Empty>
    );
  }
  switch (route.view) {
    case 'results':
      return <Results index={index} route={route} hash={hash} />;
    case 'runs':
      return <Runs index={index} route={route} hash={hash} />;
    case 'run':
      return <RunView index={index} route={route} hash={hash} />;
    case 'trial':
      return <TrialView index={index} route={route} hash={hash} />;
    case 'case':
      return <CaseView index={index} route={route} hash={hash} />;
    case 'compare':
      return <Compare index={index} route={route} hash={hash} />;
    default:
      return <NotFound path={route.path} />;
  }
}
