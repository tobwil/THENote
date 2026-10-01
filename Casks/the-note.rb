cask "the-note" do
  version "0.2.3"
  sha256 "920824d10a714d297631515ba95d67ee3e6083af9f2091308cd8e343ffd02472"

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
    This is a preview for Apple Silicon, ad-hoc signed and not Apple-notarized.
    If macOS blocks opening, review THE Note in System Settings > Privacy & Security.
    Save your notes and quit THE Note before upgrading. Note files are not removed.
  EOS
end
