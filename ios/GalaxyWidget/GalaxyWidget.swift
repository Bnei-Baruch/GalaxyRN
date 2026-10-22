import AppIntents
import SwiftUI
import WidgetKit

// Home-screen widget, same states as Android's GxyWidgetProvider:
// - no room selected: logo + "open the app"
// - room selected, not in it: Join (com.galaxy.mobile://join) + audio mode /
//   camera toggles for the next join
// - in the room: mic / camera toggles + open app
// The state is pushed by the app's WidgetModule into the shared App Group.
// Toggles (iOS 17+ AppIntents, run here in the extension) are stored as
// "pending" and announced to the app with a Darwin notification; the app
// applies them (src/zustand/widget.ts) right away or on its next launch.

private let appGroup = "group.com.galaxy.mobile"
private let actionNotification = "com.galaxy.mobile.widgetAction"
private let joinURL = URL(string: "com.galaxy.mobile://join")!
private let openURL = URL(string: "com.galaxy.mobile://open")!
private let accent = Color(red: 0x03 / 255, green: 0xA9 / 255, blue: 0xF4 / 255)
private let toggleOff = Color(red: 0x4D / 255, green: 0x51 / 255, blue: 0x56 / 255)
private let widgetColor = Color(red: 0x20 / 255, green: 0x21 / 255, blue: 0x24 / 255)
private let widgetInRoomColor = Color(red: 0x1B / 255, green: 0x2E / 255, blue: 0x21 / 255)
private let inRoomColor = Color(red: 0x4C / 255, green: 0xAF / 255, blue: 0x50 / 255)
private let notInRoomColor = Color(red: 0x8A / 255, green: 0x8F / 255, blue: 0x96 / 255)

private enum Key {
    static let room = "last_room"
    static let inRoom = "in_room"
    static let micOn = "mic_on"
    static let cammute = "cammute"
    static let audioMode = "audio_mode"
    static let pending = "pending"
}

// Mirrors android/app/src/main/res/values*/strings.xml
private struct Strings {
    let join: String
    let noRoom: String
    let description: String
    let mic: String
    let camera: String
    let audioMode: String
    let open: String
    let inRoom: String
    let notInRoom: String

    private static let table: [String: Strings] = [
        "en": Strings(join: "Join", noRoom: "Open the app to select a ten", description: "Quick join to your ten",
                      mic: "Mic", camera: "Camera", audioMode: "Audio mode", open: "Open", inRoom: "In room", notInRoom: "Not in room"),
        "ru": Strings(join: "Войти", noRoom: "Откройте приложение и выберите десятку", description: "Быстрый вход в десятку",
                      mic: "Микрофон", camera: "Камера", audioMode: "Аудио", open: "Открыть", inRoom: "В комнате", notInRoom: "Не в комнате"),
        "he": Strings(join: "כנס", noRoom: "פתח את האפליקציה ובחר עשירייה", description: "כניסה מהירה לעשירייה",
                      mic: "מיקרופון", camera: "מצלמה", audioMode: "אודיו", open: "פתח", inRoom: "בחדר", notInRoom: "לא בחדר"),
        "es": Strings(join: "Unirse", noRoom: "Abre la app para elegir un diez", description: "Acceso rápido a tu diez",
                      mic: "Micrófono", camera: "Cámara", audioMode: "Audio", open: "Abrir", inRoom: "En la sala", notInRoom: "Fuera de la sala"),
    ]

    static var current: Strings {
        let lang = Locale.preferredLanguages.first.map { String($0.prefix(2)) } ?? "en"
        return table[lang] ?? table["en"]!
    }
}

struct WidgetStateEntry: TimelineEntry {
    let date: Date
    let room: String?
    let isInRoom: Bool
    let isMicOn: Bool
    let isCamOn: Bool
    let isAudioMode: Bool

    static func load() -> WidgetStateEntry {
        let defaults = UserDefaults(suiteName: appGroup)
        let room = defaults?.string(forKey: Key.room)
        let hasRoom = room?.isEmpty == false
        return WidgetStateEntry(
            date: Date(),
            room: hasRoom ? room : nil,
            isInRoom: hasRoom && defaults?.bool(forKey: Key.inRoom) == true,
            isMicOn: defaults?.bool(forKey: Key.micOn) == true,
            isCamOn: (defaults?.object(forKey: Key.cammute) as? Bool ?? true) == false,
            isAudioMode: defaults?.bool(forKey: Key.audioMode) == true
        )
    }
}

struct WidgetStateProvider: TimelineProvider {
    func placeholder(in context: Context) -> WidgetStateEntry {
        WidgetStateEntry(date: Date(), room: nil, isInRoom: false, isMicOn: false, isCamOn: false, isAudioMode: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (WidgetStateEntry) -> Void) {
        completion(WidgetStateEntry.load())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WidgetStateEntry>) -> Void) {
        // Only changes when the app or a toggle reloads timelines
        completion(Timeline(entries: [WidgetStateEntry.load()], policy: .never))
    }
}

// SF Symbol, or an Assets.xcassets template image (icons matching the app's
// MaterialIcons, e.g. audio mode's "hearing")
enum WidgetIcon {
    case system(String)
    case asset(String)
}

// MARK: - Toggles (iOS 17+)

@available(iOS 17.0, *)
enum WidgetToggle: String, AppEnum {
    case mic
    case camera
    case audioMode

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Toggle"
    static var caseDisplayRepresentations: [WidgetToggle: DisplayRepresentation] = [
        .mic: "Mic",
        .camera: "Camera",
        .audioMode: "Audio mode",
    ]
}

@available(iOS 17.0, *)
struct ToggleIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle"
    static var isDiscoverable = false

    @Parameter(title: "Toggle")
    var toggle: WidgetToggle

    init() {}

    init(_ toggle: WidgetToggle) {
        self.toggle = toggle
    }

    func perform() async throws -> some IntentResult {
        guard let defaults = UserDefaults(suiteName: appGroup) else { return .result() }

        let cammute = defaults.object(forKey: Key.cammute) as? Bool ?? true
        let audioMode = defaults.bool(forKey: Key.audioMode)

        switch toggle {
        case .mic:
            guard defaults.bool(forKey: Key.inRoom) else { return .result() }
            defaults.set(!defaults.bool(forKey: Key.micOn), forKey: Key.micOn)
        case .camera:
            // Same as the app: the camera is off in audio mode
            defaults.set(!cammute, forKey: Key.cammute)
            if cammute && audioMode {
                defaults.set(false, forKey: Key.audioMode)
            }
        case .audioMode:
            defaults.set(!audioMode, forKey: Key.audioMode)
            if !audioMode {
                defaults.set(true, forKey: Key.cammute)
            }
        }
        defaults.set(true, forKey: Key.pending)

        CFNotificationCenterPostNotification(
            CFNotificationCenterGetDarwinNotifyCenter(),
            CFNotificationName(actionNotification as CFString),
            nil, nil, true
        )
        return .result()
    }
}

// MARK: - Views

struct GalaxyWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: WidgetStateEntry
    private let strings = Strings.current

    var body: some View {
        content
            // Small widgets only support a whole-widget URL; medium has a Join link
            .widgetURL(family == .systemSmall && entry.room != nil && !entry.isInRoom ? joinURL : nil)
            .widgetBackground(entry.isInRoom ? widgetInRoomColor : widgetColor)
    }

    @ViewBuilder
    private var content: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                logo
                VStack(alignment: .leading, spacing: 2) {
                    if family != .systemSmall {
                        Text("Arvut System")
                            .font(.headline)
                            .foregroundColor(.white)
                            .lineLimit(1)
                    }
                    roomText
                    if entry.room != nil {
                        status
                    }
                }
                Spacer(minLength: 0)
                if family != .systemSmall, entry.room != nil, !entry.isInRoom {
                    Link(destination: joinURL) {
                        label(strings.join, color: accent)
                    }
                }
            }
            if entry.room != nil {
                Spacer(minLength: 0)
                controls
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private var controls: some View {
        if #available(iOSApplicationExtension 17.0, *) {
            HStack(spacing: 6) {
                if entry.isInRoom {
                    toggleButton(.mic, isOn: entry.isMicOn,
                                 icon: .system(entry.isMicOn ? "mic.fill" : "mic.slash.fill"), title: strings.mic)
                } else {
                    toggleButton(.audioMode, isOn: entry.isAudioMode, icon: .asset("Hearing"), title: strings.audioMode)
                }
                toggleButton(.camera, isOn: entry.isCamOn,
                             icon: .system(entry.isCamOn ? "video.fill" : "video.slash.fill"), title: strings.camera)
                if entry.isInRoom, family != .systemSmall {
                    Link(destination: openURL) {
                        buttonFace(isOn: false, icon: .system("arrow.up.forward.app"), title: strings.open)
                    }
                }
            }
        }
    }

    @available(iOSApplicationExtension 17.0, *)
    private func toggleButton(_ toggle: WidgetToggle, isOn: Bool, icon: WidgetIcon, title: String) -> some View {
        Button(intent: ToggleIntent(toggle)) {
            buttonFace(isOn: isOn, icon: icon, title: title)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func iconImage(_ icon: WidgetIcon) -> some View {
        switch icon {
        case .system(let name):
            Image(systemName: name)
                .font(.system(size: 16, weight: .semibold))
        case .asset(let name):
            Image(name)
                .renderingMode(.template)
                .resizable()
                .scaledToFit()
                .frame(width: 20, height: 20)
        }
    }

    private func buttonFace(isOn: Bool, icon: WidgetIcon, title: String) -> some View {
        VStack(spacing: 2) {
            iconImage(icon)
            if family != .systemSmall {
                Text(title)
                    .font(.caption2)
                    .lineLimit(1)
            }
        }
        .foregroundColor(.white)
        .frame(maxWidth: .infinity, minHeight: family == .systemSmall ? 36 : 46)
        .background(RoundedRectangle(cornerRadius: 12).fill(isOn ? accent : toggleOff))
    }

    private var logo: some View {
        Image("Logo")
            .resizable()
            .frame(width: 40, height: 40)
            .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    private var roomText: some View {
        Text(entry.room ?? strings.noRoom)
            .font(.subheadline)
            .foregroundColor(.white.opacity(0.7))
            .lineLimit(entry.room != nil ? 1 : 2)
    }

    // In room: green dot + text (and a dark green background)
    private var status: some View {
        let color = entry.isInRoom ? inRoomColor : notInRoomColor
        return HStack(spacing: 5) {
            Circle()
                .fill(color)
                .frame(width: 7, height: 7)
            Text(entry.isInRoom ? strings.inRoom : strings.notInRoom)
                .font(.caption.bold())
                .foregroundColor(color)
                .lineLimit(1)
        }
    }

    private func label(_ text: String, color: Color) -> some View {
        Text(text)
            .font(.subheadline.bold())
            .foregroundColor(.white)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Capsule().fill(color))
    }
}

private extension View {
    @ViewBuilder
    func widgetBackground(_ color: Color) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(for: .widget) { color }
        } else {
            padding().background(color)
        }
    }
}

@main
struct GalaxyWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "GalaxyWidget", provider: WidgetStateProvider()) { entry in
            GalaxyWidgetView(entry: entry)
        }
        .configurationDisplayName("Arvut System")
        .description(Strings.current.description)
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
