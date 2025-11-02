class Mdox < Formula
  desc "Blazingly fast, cross-platform Markdown viewer and editor"
  homepage "https://github.com/yourusername/mdox"
  version "0.1.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/yourusername/mdox/releases/download/v0.1.0/mdox-aarch64.dmg"
      sha256 "YOUR_SHA256_HERE"
    else
      url "https://github.com/yourusername/mdox/releases/download/v0.1.0/mdox-x86_64.dmg"
      sha256 "YOUR_SHA256_HERE"
    end
  end

  def install
    prefix.install "mdox.app"
    bin.install_symlink "#{prefix}/mdox.app/Contents/MacOS/mdox" => "mdox"
  end

  def caveats
    <<~EOS
      To open Markdown files with mdox from the command line:
        mdox README.md
    EOS
  end

  test do
    system "#{bin}/mdox", "--version"
  end
end
