
  Pod::Spec.new do |s|
    s.name = 'TeamhiveCapacitorWebviewOverlay'
    s.version = '0.4.4'
    s.summary = 'Webview Overlay'
    s.license = 'MIT'
    s.homepage = 'https://teamhive.com/'
    s.author = 'TeamHive'
    s.source = { :git => 'https://github.com/TeamHive/capacitor-webview-overlay', :tag => s.version.to_s }
    s.source_files = 'ios/Plugin/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}'
    s.ios.deployment_target  = '11.0'
    s.dependency 'Capacitor'
  end