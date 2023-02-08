import ProjectDescription

enum BaseSettings {

    static let appName = "RN Debug App"

    static let settingsDictionary: [String: SettingValue] = [
        "DEVELOPMENT_TEAM": .string("N8UN9TR5DY"),
        "IPHONEOS_DEPLOYMENT_TARGET": .string("11.0")
    ]
}

enum AppSettings {

    static let settingsDictionary = SettingsDictionary()
        .merging(BaseSettings.settingsDictionary)
        .merging(["CODE_SIGN_IDENTITY": .string("Apple Development: DX Primer (8B5K7AGMS8)")])
        .manualCodeSigning(provisioningProfileSpecifier: "match Development com.primerapi.example.rn")

    static let settingsConfigurations: [Configuration] = [.debug(name: "Debug", settings: settingsDictionary),
                                                          .release(name: "Release", settings: settingsDictionary)]

    static let settings = Settings.settings(configurations: settingsConfigurations)
}

enum TestAppSettings {

    static let settingsDictionary = SettingsDictionary()
        .merging(BaseSettings.settingsDictionary)

    static let settingsConfigurations: [Configuration] = [.debug(name: "Debug", settings: settingsDictionary),
                                                          .release(name: "Release", settings: settingsDictionary)]

    static let settings = Settings.settings(configurations: settingsConfigurations)
}

let project = Project(
    name: "Primer.io Debug App",
    organizationName: "Primer API Ltd",
    targets: [
        Target(
            name: BaseSettings.appName,
            platform: .iOS,
            product: .app,
            bundleId: "com.primerapi.example.rn",
            infoPlist: "Info.plist",
            settings: AppSettings.settings
        ),
        Target(
            name: "Debug App Tests",
            platform: .iOS,
            product: .unitTests,
            bundleId: "com.primerapi.example.rnTests",
            infoPlist: .default,
            dependencies: [
                .target(name: BaseSettings.appName)
            ],
            settings: TestAppSettings.settings
        )
    ],
    schemes: [
        Scheme(name: BaseSettings.appName,
               shared: true,
               buildAction: .buildAction(targets: [TargetReference(stringLiteral: BaseSettings.appName)]),
               testAction: .targets([TestableTarget(stringLiteral: BaseSettings.appName)]),
               runAction: .runAction(executable: TargetReference(stringLiteral: BaseSettings.appName),
                                     arguments:
                                        Arguments(launchArguments: [
                                            LaunchArgument(name: "-PrimerDebugEnabled", isEnabled: true),
                                            LaunchArgument(name: "-PrimerAnalyticsDebugEnabled", isEnabled: true)
                                        ]
                                                 )
                                    )
              )
    ]
)
