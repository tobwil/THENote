cask "the-note" do
  version "0.2.8"
  sha256 "e1576d237e8fe846bb8c1a52a7c36cc8c03287b0b745d9ed0a31b1752630b478"

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
