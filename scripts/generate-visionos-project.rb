#!/usr/bin/env ruby
# Maintainer utility; the generated project is checked in and builds without Ruby.
require 'xcodeproj'
require 'fileutils'

root = File.expand_path('../apps/visionos', __dir__)
path = File.join(root, 'ShapeStudio.xcodeproj')
project = Xcodeproj::Project.new(path)
project.root_object.attributes['LastUpgradeCheck'] = '2600'
app = project.new_target(:application, 'ShapeStudio', :visionos, '26.0', nil, :swift)
ui = project.new_target(:ui_test_bundle, 'ShapeStudioUITests', :visionos, '26.0', nil, :swift)
ui.add_dependency(app)
unit = project.new_target(:unit_test_bundle, 'ShapeStudioTests', :visionos, '26.0', nil, :swift)
unit.add_dependency(app)

[['ShapeStudio', app], ['ShapeStudioUITests', ui], ['ShapeStudioTests', unit]].each do |folder, target|
  group = project.main_group.new_group(folder, folder)
  Dir.glob(File.join(root, folder, '**', '*.swift')).sort.each do |source|
    target.source_build_phase.add_file_reference(group.new_file(source.delete_prefix(File.join(root, folder) + '/')))
  end
  Dir.glob(File.join(root, folder, 'Fixtures', '*.usdz')).sort.each do |resource|
    target.resources_build_phase.add_file_reference(group.new_file(resource.delete_prefix(File.join(root, folder) + '/')))
  end
end
config = project.main_group.new_group('Config', 'Config')
shared = config.new_file('Shared.xcconfig')
config.new_file('Local.xcconfig.example')
local = project.new(Xcodeproj::Project::Object::XCLocalSwiftPackageReference)
local.relative_path = 'ShapeStudioCore'
project.root_object.package_references << local
clerk = project.new(Xcodeproj::Project::Object::XCRemoteSwiftPackageReference)
clerk.repositoryURL = 'https://github.com/clerk/clerk-ios.git'
clerk.requirement = { 'kind' => 'exactVersion', 'version' => '1.5.8' }
project.root_object.package_references << clerk
[['ShapeStudioCore', local], ['ClerkKit', clerk]].each do |name, package|
  dependency = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
  dependency.package = package
  dependency.product_name = name
  app.package_product_dependencies << dependency
  file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
  file.product_ref = dependency
  app.frameworks_build_phase.files << file
end

[app, ui, unit].each do |target|
  target.build_configurations.each do |configuration|
    configuration.base_configuration_reference = shared
    configuration.build_settings.merge!({
      'SWIFT_VERSION' => '6.0', 'SWIFT_STRICT_CONCURRENCY' => 'complete',
      'SUPPORTED_PLATFORMS' => 'xros xrsimulator', 'XROS_DEPLOYMENT_TARGET' => '26.0',
      'TARGETED_DEVICE_FAMILY' => '7', 'GENERATE_INFOPLIST_FILE' => 'YES',
      'CODE_SIGN_STYLE' => 'Automatic', 'CURRENT_PROJECT_VERSION' => '1',
      'MARKETING_VERSION' => '0.1.0', 'ENABLE_USER_SCRIPT_SANDBOXING' => 'YES',
    })
  end
end
app.build_configurations.each do |configuration|
  configuration.build_settings.merge!({
    'PRODUCT_BUNDLE_IDENTIFIER' => 'com.example.shapestudio.spatial',
    'INFOPLIST_KEY_CFBundleDisplayName' => 'Shape Studio',
    'INFOPLIST_KEY_UIApplicationSceneManifest_Generation' => 'YES',
    'INFOPLIST_KEY_UIApplicationSupportsMultipleScenes' => 'YES',
    'INFOPLIST_KEY_SHAPE_API_BASE_URL' => '$(SHAPE_API_BASE_URL)',
    'INFOPLIST_KEY_SHAPE_CLERK_PUBLISHABLE_KEY' => '$(SHAPE_CLERK_PUBLISHABLE_KEY)',
    'INFOPLIST_KEY_LSApplicationCategoryType' => 'public.app-category.productivity',
  })
end
ui.build_configurations.each do |configuration|
  configuration.build_settings.merge!({ 'PRODUCT_BUNDLE_IDENTIFIER' => 'com.example.shapestudio.spatial.uitests', 'TEST_TARGET_NAME' => 'ShapeStudio' })
end
unit.build_configurations.each do |configuration|
  configuration.build_settings.merge!({
    'PRODUCT_BUNDLE_IDENTIFIER' => 'com.example.shapestudio.spatial.tests',
    'TEST_HOST' => '$(BUILT_PRODUCTS_DIR)/ShapeStudio.app/ShapeStudio',
    'BUNDLE_LOADER' => '$(TEST_HOST)',
  })
end
project.predictabilize_uuids
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.set_launch_target(app)
scheme.add_test_target(ui)
scheme.add_test_target(unit)
scheme.save_as(path, 'ShapeStudio', true)
puts "Generated #{path}"
