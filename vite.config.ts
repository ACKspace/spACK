import { ConfigEnv } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';
import { execSync } from 'child_process';

export default ({ mode }: ConfigEnv) => {
  const dev = mode === 'development';

  const tagName = execSync('git describe --tags $(git rev-list --tags --max-count=1) || echo "no version"').toString().trimEnd();
  const commitDate = execSync('git log -1 --format=%cI').toString().trimEnd();
  const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trimEnd();
  const commitHash = execSync('git rev-parse HEAD').toString().trimEnd();
  const lastCommitMessage = execSync('git show -s --format=%s').toString().trimEnd();

  const version = dev ? `${tagName} (${commitHash.substring(0,7)})` : tagName;

  process.env.VITE_VERSION = version;
  process.env.VITE_GIT_TAG = tagName;
  process.env.VITE_GIT_COMMIT_DATE = commitDate;
  process.env.VITE_GIT_BRANCH_NAME = branchName;
  process.env.VITE_GIT_COMMIT_HASH = commitHash;
  process.env.VITE_GIT_LAST_COMMIT_MESSAGE = lastCommitMessage;

  return {
    base: '', // Relative paths
    plugins: [devtools(), solidPlugin()],
    server: {
      port: 3000,
    },
    build: {
      target: 'esnext',
    },
    optimizeDeps: {
      // exclude: ["solid-canvas/*"],
    },
  };
}
