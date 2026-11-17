cmake_minimum_required(VERSION 3.20)
project(duckdesk-input-helper LANGUAGES CXX)

add_executable(input-helper src/main.cpp)
target_compile_features(input-helper PRIVATE cxx_std_17)
target_compile_options(input-helper PRIVATE /O2 /MT)
target_link_libraries(input-helper PRIVATE user32)
set_target_properties(input-helper PROPERTIES OUTPUT_NAME "input-helper")
