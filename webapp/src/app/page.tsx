"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type {
  GenerateContentRequest,
  GeneratedContentPayload,
  SchedulePostRequest,
  ScheduledPostPayload,
  TrendPayload,
} from "@/lib/types";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ur", label: "Urdu" },
];

const REGIONS = [
  { value: "US", label: "United States" },
  { value: "PK", label: "Pakistan" },
  { value: "GB", label: "United Kingdom" },
  { value: "AE", label: "UAE" },
];

const CATEGORIES = [
  "general",
  "technology",
  "business",
  "sports",
  "entertainment",
  "lifestyle",
  "gaming",
  "finance",
];

const PLATFORMS = [
  "facebook",
  "instagram",
  "twitter",
  "pinterest",
  "youtube",
  "threads",
];

const TONES = ["informative", "funny", "professional", "inspirational"];

interface AccountSummary {
  id: string;
  platform: string;
  accountName: string;
}

async function fetchJSON<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

export default function Dashboard() {
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [region, setRegion] = useState(REGIONS[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [length, setLength] = useState<GenerateContentRequest["length"]>("short");
  const [platforms, setPlatforms] = useState<string[]>(["twitter", "instagram"]);
  const [customVoice, setCustomVoice] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [includeImage, setIncludeImage] = useState(true);

  const [trends, setTrends] = useState<TrendPayload[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedTrendId, setSelectedTrendId] = useState<string | null>(null);

  const [generatedContent, setGeneratedContent] = useState<
    GeneratedContentPayload[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPostPayload[]>(
    [],
  );
  const [isScheduling, setIsScheduling] = useState(false);

  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({
    platform: "facebook",
    accountName: "",
    accessToken: "",
    refreshToken: "",
  });

  const selectedTrend = useMemo(
    () => trends.find((trend) => trend.id === selectedTrendId) ?? null,
    [selectedTrendId, trends],
  );

  const discover = useCallback(async () => {
    setIsDiscovering(true);
    try {
      const data = await fetchJSON<{ trends: TrendPayload[] }>("/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: language.value,
          region: region.value,
          category,
        }),
      });
      setTrends(data.trends);
      if (!selectedTrendId && data.trends.length) {
        setSelectedTrendId(data.trends[0].id);
      }
    } catch (error) {
      console.error("Failed to refresh trends", error);
    } finally {
      setIsDiscovering(false);
    }
  }, [language.value, region.value, category, selectedTrendId]);

  const loadTrends = useCallback(async () => {
    try {
      const data = await fetchJSON<{ trends: TrendPayload[] }>("/api/trends");
      setTrends(data.trends);
      if (!selectedTrendId && data.trends.length) {
        setSelectedTrendId(data.trends[0].id);
      }
    } catch (error) {
      console.error("Failed to load trends", error);
    }
  }, [selectedTrendId]);

  const loadScheduled = useCallback(async () => {
    try {
      const data = await fetchJSON<{ posts: ScheduledPostPayload[] }>(
        "/api/schedule",
      );
      setScheduledPosts(data.posts);
    } catch (error) {
      console.error("Failed to load scheduled posts", error);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await fetchJSON<{ accounts: AccountSummary[] }>(
        "/api/accounts",
      );
      setAccounts(data.accounts);
    } catch (error) {
      console.error("Failed to load accounts", error);
    }
  }, []);

  useEffect(() => {
    void loadTrends();
    void loadScheduled();
    void loadAccounts();
  }, [loadTrends, loadScheduled, loadAccounts]);

  const handleApproveTrend = async (trend: TrendPayload, approved: boolean) => {
    setTrends((prev) =>
      prev.map((item) =>
        item.id === trend.id ? { ...item, approved } : item,
      ),
    );
    try {
      await fetchJSON(`/api/trends/${trend.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
    } catch (error) {
      console.error("Failed to update approval", error);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const payload: GenerateContentRequest = {
        trendId: selectedTrend?.id ?? null,
        customPrompt: customPrompt.trim() || undefined,
        platforms,
        tone,
        voice: customVoice.trim() || undefined,
        includeImage,
        language: language.value,
        length,
      };

      const data = await fetchJSON<{ content: GeneratedContentPayload[] }>(
        "/api/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      setGeneratedContent(data.content);
    } catch (error) {
      console.error("Failed to generate content", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSchedule = async (input: SchedulePostRequest) => {
    setIsScheduling(true);
    try {
      await fetchJSON("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      await loadScheduled();
    } catch (error) {
      console.error("Failed to schedule post", error);
    } finally {
      setIsScheduling(false);
    }
  };

  const handlePublishNow = async (postId: string) => {
    try {
      await fetchJSON("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledPostId: postId }),
      });
      await loadScheduled();
    } catch (error) {
      console.error("Manual publish failed", error);
    }
  };

  const handleAccountSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingAccount(true);
    try {
      await fetchJSON("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...accountForm,
          metadata: {},
        }),
      });
      setAccountForm({
        platform: accountForm.platform,
        accountName: "",
        accessToken: "",
        refreshToken: "",
      });
      await loadAccounts();
    } catch (error) {
      console.error("Failed to create account", error);
    } finally {
      setIsSavingAccount(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[1440px] flex-col gap-8 px-6 py-12 lg:px-12">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="pill border-blue-500/40 bg-blue-500/10 text-blue-100">
            Private AI Agent
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-4xl">
            Social Command Center
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Discover what&apos;s trending, generate localized content in English
            or Urdu, and automate publishing across Facebook, Instagram, X,
            YouTube, Pinterest, Threads, and more.
          </p>
        </div>
        <div className="glass max-w-sm text-sm text-slate-200">
          <p className="font-semibold uppercase tracking-widest text-slate-300">
            Active Filters
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <span className="card bg-slate-900/60 p-3 text-slate-300">
              Language
              <strong className="mt-1 block text-base text-white">
                {language.label}
              </strong>
            </span>
            <span className="card bg-slate-900/60 p-3 text-slate-300">
              Region
              <strong className="mt-1 block text-base text-white">
                {region.label}
              </strong>
            </span>
            <span className="card bg-slate-900/60 p-3 text-slate-300">
              Category
              <strong className="mt-1 block text-base text-white capitalize">
                {category}
              </strong>
            </span>
            <span className="card bg-slate-900/60 p-3 text-slate-300">
              Tone
              <strong className="mt-1 block text-base text-white capitalize">
                {tone}
              </strong>
            </span>
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="card space-y-6">
          <header className="flex flex-col gap-3 border-b border-white/5 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Trending Discovery</h2>
              <p className="text-sm text-slate-400">
                Aggregates Google Trends, Reddit, and YouTube. Approve the
                signals you want to feed into content generation.
              </p>
            </div>
            <button
              type="button"
              onClick={discover}
              disabled={isDiscovering}
              className="inline-flex items-center justify-center rounded-lg border border-blue-500/50 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-500/20 disabled:cursor-wait disabled:opacity-50"
            >
              {isDiscovering ? "Refreshing…" : "Refresh Trends"}
            </button>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Language
              <select
                className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm"
                value={language.value}
                onChange={(event) => {
                  const next = LANGUAGES.find(
                    (item) => item.value === event.target.value,
                  );
                  if (next) setLanguage(next);
                }}
              >
                {LANGUAGES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Region
              <select
                className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm"
                value={region.value}
                onChange={(event) => {
                  const next = REGIONS.find(
                    (item) => item.value === event.target.value,
                  );
                  if (next) setRegion(next);
                }}
              >
                {REGIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Category
              <select
                className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm capitalize"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Tone
              <select
                className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm capitalize"
                value={tone}
                onChange={(event) => setTone(event.target.value)}
              >
                {TONES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-4">
            {trends.length === 0 && (
              <div className="rounded-lg border border-white/10 bg-slate-900/80 p-8 text-center text-sm text-slate-400">
                No trends yet. Use Refresh Trends to pull fresh signals.
              </div>
            )}
            {trends.map((trend) => (
              <article
                key={trend.id}
                className={`rounded-xl border p-4 transition ${
                  selectedTrendId === trend.id
                    ? "border-blue-500/60 bg-blue-500/10"
                    : "border-white/10 bg-slate-900/70 hover:border-blue-500/30"
                }`}
              >
                <header className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="text-left text-lg font-medium text-white"
                    onClick={() => setSelectedTrendId(trend.id)}
                  >
                    {trend.title}
                  </button>
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {trend.source}
                  </span>
                </header>
                {trend.summary && (
                  <p className="mt-2 text-sm text-slate-300">{trend.summary}</p>
                )}
                <footer className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>
                    {trend.popularityScore
                      ? `Score ${trend.popularityScore}`
                      : "Organic signal"}
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(trend.fetchedAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {trend.url && (
                    <a
                      href={trend.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/10 px-2 py-1 text-xs text-blue-200 hover:border-blue-400 hover:text-blue-100"
                    >
                      Source
                    </a>
                  )}
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      trend.approved
                        ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                        : "border border-white/20 bg-white/5 text-slate-200"
                    }`}
                    onClick={() => handleApproveTrend(trend, !trend.approved)}
                  >
                    {trend.approved ? "Approved" : "Approve"}
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </div>

        <aside className="card space-y-5">
          <header>
            <h2 className="text-xl font-semibold">Content Studio</h2>
            <p className="text-sm text-slate-400">
              Generate copy &amp; image prompts per platform, tuned for your
              tone and target language.
            </p>
          </header>

          <div className="space-y-4">
            <div className="grid gap-2 text-sm">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                Platforms
              </span>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((platform) => {
                  const active = platforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      type="button"
                      className={`rounded-full px-3 py-1 text-xs capitalize transition ${
                        active
                          ? "border border-blue-500/50 bg-blue-500/20 text-blue-100"
                          : "border border-white/10 bg-white/5 text-slate-300 hover:border-blue-400/50 hover:text-blue-100"
                      }`}
                      onClick={() => {
                        setPlatforms((prev) =>
                          prev.includes(platform)
                            ? prev.filter((item) => item !== platform)
                            : [...prev, platform],
                        );
                      }}
                    >
                      {platform}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex flex-col gap-2 text-sm">
              Voice Customization
              <textarea
                className="min-h-[90px] rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
                placeholder="Optional: Describe the persona, e.g. 'Witty marketer who loves cricket references'."
                value={customVoice}
                onChange={(event) => setCustomVoice(event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              Custom Prompt
              <textarea
                className="min-h-[90px] rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
                placeholder="Optional: Add CTA, legal notes, campaign angle..."
                value={customPrompt}
                onChange={(event) => setCustomPrompt(event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              Length
              <select
                className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm capitalize"
                value={length}
                onChange={(event) =>
                  setLength(event.target.value as GenerateContentRequest["length"])
                }
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={includeImage}
                onChange={(event) => setIncludeImage(event.target.checked)}
                className="h-3.5 w-3.5 rounded border border-white/10 bg-slate-900/70"
              />
              Request hero image prompts
            </label>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !selectedTrend}
              className="w-full rounded-lg border border-purple-500/60 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? "Generating…" : "Generate Content"}
            </button>
          </div>

          {generatedContent.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                AI Output
              </h3>
              <div className="space-y-3">
                {generatedContent.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-white/10 bg-slate-900/70 p-4"
                  >
                    <header className="flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-widest text-blue-200">
                        {item.platform}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void handleSchedule({
                            platform: item.platform,
                            accountId: accounts.find(
                              (account) => account.platform === item.platform,
                            )?.id,
                            contentId: item.id,
                            scheduledFor: new Date(
                              Date.now() + 1000 * 60 * 5,
                            ).toISOString(),
                          })
                        }
                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100"
                      >
                        Quick Schedule (+5m)
                      </button>
                    </header>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-100">
                      {item.content}
                    </p>
                    {item.hashtags && (
                      <p className="mt-3 text-xs text-blue-200">
                        {item.hashtags}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card space-y-5">
          <header className="flex flex-col gap-3 border-b border-white/5 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Scheduler</h2>
              <p className="text-sm text-slate-400">
                Choose platform credentials, set a time, and let the agent post.
              </p>
            </div>
          </header>

          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Platform</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-900/40 text-slate-100">
                {scheduledPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 capitalize">{post.platform}</td>
                    <td className="px-4 py-3">
                      {post.accountName ?? "Default credentials"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {formatDistanceToNow(new Date(post.scheduledFor), {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          post.status === "POSTED"
                            ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                            : post.status === "FAILED"
                              ? "border border-rose-500/40 bg-rose-500/10 text-rose-100"
                              : "border border-white/10 bg-white/10 text-slate-200"
                        }`}
                      >
                        {post.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handlePublishNow(post.id)}
                        className="rounded-full border border-blue-500/40 px-3 py-1 text-xs text-blue-100"
                      >
                        Push Now
                      </button>
                    </td>
                  </tr>
                ))}
                {scheduledPosts.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-sm text-slate-400"
                    >
                      No scheduled posts yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {generatedContent.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {generatedContent.map((item) => (
                <form
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    const scheduledFor = formData.get("scheduledFor") as string;
                    const accountId = formData.get("accountId") as string | null;
                    void handleSchedule({
                      platform: item.platform,
                      accountId: accountId || undefined,
                      contentId: item.id,
                      scheduledFor,
                    });
                    event.currentTarget.reset();
                  }}
                >
                  <header className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-slate-400">
                      {item.platform}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[0.65rem] uppercase text-slate-300">
                      Schedule
                    </span>
                  </header>
                  <p className="mt-3 text-xs text-slate-400">
                    {selectedTrend?.title ?? "Custom prompt"}
                  </p>
                  <label className="mt-3 flex flex-col gap-1 text-xs">
                    Publish time
                    <input
                      required
                      type="datetime-local"
                      name="scheduledFor"
                      className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="mt-3 flex flex-col gap-1 text-xs">
                    Account
                    <select
                      name="accountId"
                      className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm capitalize"
                    >
                      <option value="">Default credentials</option>
                      {accounts
                        .filter((account) => account.platform === item.platform)
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.accountName}
                          </option>
                        ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    disabled={isScheduling}
                    className="mt-4 w-full rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {isScheduling ? "Scheduling…" : "Confirm Schedule"}
                  </button>
                </form>
              ))}
            </div>
          )}
        </div>

        <aside className="card space-y-5">
          <header>
            <h2 className="text-xl font-semibold">Account Vault</h2>
            <p className="text-sm text-slate-400">
              Store private tokens for each platform. These are never exposed to
              the frontend.
            </p>
          </header>

          <form
            className="space-y-3 text-sm"
            onSubmit={handleAccountSubmit}
            autoComplete="off"
          >
            <label className="flex flex-col gap-1">
              Platform
              <select
                className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm capitalize"
                value={accountForm.platform}
                onChange={(event) =>
                  setAccountForm((prev) => ({
                    ...prev,
                    platform: event.target.value,
                  }))
                }
              >
                {PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              Account Label
              <input
                required
                value={accountForm.accountName}
                onChange={(event) =>
                  setAccountForm((prev) => ({
                    ...prev,
                    accountName: event.target.value,
                  }))
                }
                className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
                placeholder="e.g. Facebook Page: Brand PK"
              />
            </label>
            <label className="flex flex-col gap-1">
              Access Token
              <input
                required
                value={accountForm.accessToken}
                onChange={(event) =>
                  setAccountForm((prev) => ({
                    ...prev,
                    accessToken: event.target.value,
                  }))
                }
                className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm font-mono"
                placeholder="Secure access token"
              />
            </label>
            <label className="flex flex-col gap-1">
              Refresh Token (optional)
              <input
                value={accountForm.refreshToken}
                onChange={(event) =>
                  setAccountForm((prev) => ({
                    ...prev,
                    refreshToken: event.target.value,
                  }))
                }
                className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm font-mono"
                placeholder="If provided by platform"
              />
            </label>
            <button
              type="submit"
              disabled={isSavingAccount}
              className="w-full rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-500/20 disabled:opacity-50"
            >
              {isSavingAccount ? "Saving…" : "Save Credentials"}
            </button>
          </form>

          <div className="space-y-3 text-sm">
            <h3 className="text-xs uppercase tracking-wide text-slate-400">
              Connected Accounts
            </h3>
            <div className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {account.accountName}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {account.platform}
                    </p>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                <p className="text-xs text-slate-400">
                  No accounts stored yet. Add your tokens above.
                </p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

