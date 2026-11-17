#include <windows.h>

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <string>
#include <vector>

namespace {

std::vector<std::string> split(const std::string& value, char delimiter) {
  std::vector<std::string> parts;
  std::string current;

  for (char character : value) {
    if (character == delimiter) {
      parts.push_back(current);
      current.clear();
    } else {
      current.push_back(character);
    }
  }
  parts.push_back(current);
  return parts;
}

int hexValue(char character) {
  if (character >= '0' && character <= '9') return character - '0';
  if (character >= 'a' && character <= 'f') return character - 'a' + 10;
  if (character >= 'A' && character <= 'F') return character - 'A' + 10;
  return -1;
}

std::vector<uint8_t> fromHex(const std::string& hex) {
  std::vector<uint8_t> bytes;
  if (hex.size() % 2 != 0) return bytes;

  for (size_t index = 0; index + 1 < hex.size(); index += 2) {
    const int high = hexValue(hex[index]);
    const int low = hexValue(hex[index + 1]);
    if (high < 0 || low < 0) return {};
    bytes.push_back(static_cast<uint8_t>((high << 4) | low));
  }
  return bytes;
}

std::wstring utf8ToWide(const std::vector<uint8_t>& bytes) {
  if (bytes.empty()) return L"";

  const int length = MultiByteToWideChar(
      CP_UTF8, 0, reinterpret_cast<const char*>(bytes.data()),
      static_cast<int>(bytes.size()), nullptr, 0);
  if (length <= 0) return L"";

  std::wstring result(static_cast<size_t>(length), L'\0');
  MultiByteToWideChar(CP_UTF8, 0, reinterpret_cast<const char*>(bytes.data()),
                      static_cast<int>(bytes.size()), &result[0], length);
  return result;
}

void sendMouse(DWORD flags, DWORD mouseData = 0) {
  INPUT input = {};
  input.type = INPUT_MOUSE;
  input.mi.dwFlags = flags;
  input.mi.mouseData = mouseData;
  SendInput(1, &input, sizeof(INPUT));
}

void sendKey(WORD virtualKey, bool keyUp) {
  INPUT input = {};
  input.type = INPUT_KEYBOARD;
  input.ki.wVk = virtualKey;
  input.ki.dwFlags = keyUp ? KEYEVENTF_KEYUP : 0;
  SendInput(1, &input, sizeof(INPUT));
}

void sendUnicode(wchar_t character, bool keyUp) {
  INPUT input = {};
  input.type = INPUT_KEYBOARD;
  input.ki.wScan = static_cast<WORD>(character);
  input.ki.dwFlags = KEYEVENTF_UNICODE | (keyUp ? KEYEVENTF_KEYUP : 0);
  SendInput(1, &input, sizeof(INPUT));
}

void moveMouse(int x, int y) {
  const int screenWidth = GetSystemMetrics(SM_CXSCREEN);
  const int screenHeight = GetSystemMetrics(SM_CYSCREEN);

  if (screenWidth <= 1 || screenHeight <= 1) {
    SetCursorPos(x, y);
    return;
  }

  x = std::clamp(x, 0, screenWidth - 1);
  y = std::clamp(y, 0, screenHeight - 1);

.
  INPUT input = {};
  input.type = INPUT_MOUSE;
  input.mi.dx = static_cast<LONG>((static_cast<long long>(x) * 65535) / (screenWidth - 1));
  input.mi.dy = static_cast<LONG>((static_cast<long long>(y) * 65535) / (screenHeight - 1));
  input.mi.dwFlags = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE;
  SendInput(1, &input, sizeof(INPUT));
}

bool mouseFlags(const std::string& button, DWORD& down, DWORD& up) {
  if (button == "left") {
    down = MOUSEEVENTF_LEFTDOWN;
    up = MOUSEEVENTF_LEFTUP;
    return true;
  }
  if (button == "right") {
    down = MOUSEEVENTF_RIGHTDOWN;
    up = MOUSEEVENTF_RIGHTUP;
    return true;
  }
  if (button == "middle") {
    down = MOUSEEVENTF_MIDDLEDOWN;
    up = MOUSEEVENTF_MIDDLEUP;
    return true;
  }
  return false;
}

void mouseButton(const std::string& button, bool down) {
  DWORD downFlag = 0;
  DWORD upFlag = 0;
  if (!mouseFlags(button, downFlag, upFlag)) return;
  sendMouse(down ? downFlag : upFlag);
}

void clickMouse(const std::string& button, bool doubleClick) {
  DWORD downFlag = 0;
  DWORD upFlag = 0;
  if (!mouseFlags(button, downFlag, upFlag)) return;

  sendMouse(downFlag);
  sendMouse(upFlag);

  if (doubleClick) {
    Sleep(45);
    sendMouse(downFlag);
    sendMouse(upFlag);
  }
}

void scrollMouse(int delta) {
  sendMouse(MOUSEEVENTF_WHEEL, static_cast<DWORD>(delta));
}

WORD modifierKey(const std::string& name) {
  if (name == "ctrl" || name == "control") return VK_CONTROL;
  if (name == "alt") return VK_MENU;
  if (name == "shift") return VK_SHIFT;
  if (name == "meta" || name == "win" || name == "cmd") return VK_LWIN;
  return 0;
}

WORD virtualKeyFor(const std::string& key) {
  if (key.size() == 1) {
    const unsigned char character = static_cast<unsigned char>(key[0]);

    if (character >= 'a' && character <= 'z') {
      return static_cast<WORD>(std::toupper(character));
    }
    if (character >= 'A' && character <= 'Z') {
      return static_cast<WORD>(character);
    }
    if (character >= '0' && character <= '9') {
      return static_cast<WORD>(character);
    }

    const SHORT scan = VkKeyScanA(static_cast<char>(character));
    if (scan != -1) return static_cast<WORD>(scan & 0xFF);
    return 0;
  }

  if (key == "Enter") return VK_RETURN;
  if (key == "Backspace") return VK_BACK;
  if (key == "Tab") return VK_TAB;
  if (key == "Escape" || key == "Esc") return VK_ESCAPE;
  if (key == "Space" || key == "Spacebar") return VK_SPACE;
  if (key == "Delete") return VK_DELETE;
  if (key == "Insert") return VK_INSERT;
  if (key == "Home") return VK_HOME;
  if (key == "End") return VK_END;
  if (key == "PageUp") return VK_PRIOR;
  if (key == "PageDown") return VK_NEXT;
  if (key == "ArrowLeft") return VK_LEFT;
  if (key == "ArrowUp") return VK_UP;
  if (key == "ArrowRight") return VK_RIGHT;
  if (key == "ArrowDown") return VK_DOWN;
  if (key == "Shift") return VK_SHIFT;
  if (key == "Control") return VK_CONTROL;
  if (key == "Alt") return VK_MENU;
  if (key == "Meta") return VK_LWIN;
  if (key == "CapsLock") return VK_CAPITAL;
  if (key == "NumLock") return VK_NUMLOCK;
  if (key == "ScrollLock") return VK_SCROLL;
  if (key == "PrintScreen") return VK_SNAPSHOT;
  if (key == "Pause") return VK_PAUSE;
  if (key == "ContextMenu") return VK_APPS;

  if (key.size() > 1 && key[0] == 'F') {
    const int number = std::atoi(key.c_str() + 1);
    if (number >= 1 && number <= 24) {
      return static_cast<WORD>(VK_F1 + number - 1);
    }
  }

  return 0;
}

void pressKey(const std::string& key, const std::string& modifiers) {
  const WORD virtualKey = virtualKeyFor(key);
  if (virtualKey == 0) return;

  std::vector<WORD> modifierKeys;
  for (const std::string& modifier : split(modifiers, ',')) {
    if (modifier.empty()) continue;
    const WORD modifierKeyCode = modifierKey(modifier);
    if (modifierKeyCode != 0) modifierKeys.push_back(modifierKeyCode);
  }

  for (WORD modifier : modifierKeys) sendKey(modifier, false);
  sendKey(virtualKey, false);
  sendKey(virtualKey, true);
  for (auto iterator = modifierKeys.rbegin(); iterator != modifierKeys.rend(); ++iterator) {
    sendKey(*iterator, true);
  }
}

void typeText(const std::string& hex) {
  const std::vector<uint8_t> bytes = fromHex(hex);
  const std::wstring text = utf8ToWide(bytes);

  for (wchar_t character : text) {
    sendUnicode(character, false);
    sendUnicode(character, true);
  }
}

void handleCommand(const std::string& line) {
  const std::vector<std::string> parts = split(line, '|');
  if (parts.empty()) return;

  if (parts[0] == "M" && parts.size() >= 3) {
    moveMouse(std::atoi(parts[1].c_str()), std::atoi(parts[2].c_str()));
    return;
  }

  if (parts[0] == "B" && parts.size() >= 3) {
    mouseButton(parts[1], parts[2] == "1");
    return;
  }

  if (parts[0] == "C" && parts.size() >= 3) {
    clickMouse(parts[1], parts[2] == "1");
    return;
  }

  if (parts[0] == "S" && parts.size() >= 2) {
    scrollMouse(std::atoi(parts[1].c_str()));
    return;
  }

  if (parts[0] == "K" && parts.size() >= 3) {
    pressKey(parts[1], parts[2]);
    return;
  }

  if (parts[0] == "T" && parts.size() >= 2) {
    typeText(parts[1]);
  }
}

}  // namespace

int main() {
  std::ios::sync_with_stdio(false);
  std::string line;

  while (std::getline(std::cin, line)) {
    if (line.empty()) continue;
    handleCommand(line);
  }

  return 0;
}
