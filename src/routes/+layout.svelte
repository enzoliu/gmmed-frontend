<script lang="ts">
  import { onMount } from "svelte";
  import { onNavigate } from "$app/navigation";
  import NotificationContainer from "$components/NotificationContainer.svelte";
  import Header from "$components/Header.svelte";
  import "../app.css";
  import Footer from "$components/Footer.svelte";

  const { children } = $props();

  // Enable view transition
  // Ref: https://svelte.dev/blog/view-transitions
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  onMount(() => {
    document.getElementById("init-loading")?.remove();
    const container = document.getElementById("app-container");
    if (container) container.style.visibility = "visible";
  });
</script>

<!-- 全版面背景容器 -->
<div class="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative">
  <!-- 內容容器 -->
  <div class="relative z-10">
    <NotificationContainer />

    <Header />

    <main class="w-full">
      {@render children()}
    </main>
  </div>
</div>
<Footer />
