fn main() {
    println!("cargo:rerun-if-changed=../../shared/island-layout.json");
    tauri_build::build()
}
