import test from 'ava';
import { forward, record, stub } from '../handlers.mjs';

test.beforeEach((t) => {
  const rules = [];
  const addRule = (rule) => rules.push(rule);
  t.context.proxy = {
    addRequestRule: addRule,
    addWebSocketRule: addRule,
  };

  t.context.explainRules = () =>
    rules.flatMap((rule) => [
      ...rule.matchers.map((matcher) => matcher.explain()),
      rule.handler.explain(),
    ]);
  t.context.rules = rules;
});

test('localhost: basic forwarding', async (t) => {
  const config = {
    value: {
      forward: {
        'http://google.com': 'http://localhost:3000',
      },
    },
  };

  await forward(
    {
      proxy: t.context.proxy,
    },
    config
  );

  t.deepEqual(t.context.explainRules(), [
    'GlobMatcher {"target":"http://google.com/","paths":["**"]}',
    `ProxyHandler {"ignoreHostHttpsErrors":["localhost:3000"],"forwarding":{"targetHost":"http://localhost:3000","updateHostHeader":"google.com"}}`,
  ]);
});

test('localhost: glob matching', async (t) => {
  const config = {
    value: {
      forward: {
        'http://google.com': {
          target: 'http://localhost:3000',
          paths: ['/**/*', '!/**/graphql'],
          websocket: true,
        },
      },
    },
  };

  await forward(
    {
      proxy: t.context.proxy,
    },
    config
  );

  t.deepEqual(t.context.explainRules(), [
    'GlobMatcher {"target":"http://google.com/","paths":["/**/*","!/**/graphql"]}',
    'ProxyHandler {"ignoreHostHttpsErrors":["localhost:3000"],"forwarding":{"targetHost":"http://localhost:3000","updateHostHeader":"google.com"}}',
    'GlobMatcher {"target":"http://google.com/","paths":["/**/*","!/**/graphql"]}',
    'forward the websocket to ws://localhost:3000',
  ]);
});

test('cache', async (t) => {
  await record(
    { proxy: t.context.proxy },
    { value: { cache: { stage: ['**'] } } }
  );

  t.deepEqual(t.context.explainRules(), [
    'CacheMatcher {"stage":["**"]}',
    'CacheHandler return a response from cache',
  ]);
});

test('stub', async (t) => {
  const config = {
    value: {
      // NOTE: Might be better to invert this setting
      stub: {
        '**.jpg': 204,
        '**/api': { status: 200 },
      },
    },
  };

  await stub({ proxy: t.context.proxy }, config);

  t.deepEqual(t.context.explainRules(), [
    'GlobMatcher {"target":"*","paths":["**.jpg"]}',
    'respond with status 204 (jambox stub)',
    'GlobMatcher {"target":"*","paths":["**/api"]}',
    'respond with status 200 (jambox stub)',
  ]);
});
