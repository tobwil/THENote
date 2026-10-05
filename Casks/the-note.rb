cask "the-note" do
  version "0.2.10"
  sha256 "c7e89b61f0dfd73fd5aa34fc3ca1c4fd7fd24569c76d1118f69d58a9c70f50e2"

  url "https://github.com/tobwil/THENote/releases/download/v#{version}/THE.Note-macOS-arm64.zip"
  name "THE Note"
  desc "Local Markdown notebook with executable code cells and inline AI"
  homepage "https://tobwil.github.io/THENote/"

  livecheck do
    skip "Preview releases are updated after verification"
  end

  depends_on arch: :arm64
  depends_on macos: :big_sur

  app "THE Note.app"

  caveats <<~EOS
    This is a preview for Apple Silicon, Developer ID signed and Apple-notarized.
    Save your notes and quit THE Note before upgrading. Note files are not removed.
  EOS
end
