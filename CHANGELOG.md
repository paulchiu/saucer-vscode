# Change Log

All notable changes to the "saucer" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - Azure DevOps URL support

- Fixed Azure DevOps URL parsing and source URL building utilities
- Enhanced Azure DevOps URL processing with support for HTTPS, SSH, and legacy visualstudio.com formats

## [1.2.0] - Filename reference without line numbers

- Added "Filename (no line)" option to reference types
- Added support for filename reference without line numbers in copy command
- Added backward compatibility handling for old "Filename" type
- Updated configuration options to include new reference format
- Updated documentation for new reference format options

## [1.1.0] - User cancellation handling and watch script

- Added user cancellation handling in copy command
- Added cancellation support to reference functions
- Added watch script for development workflow

## [1.0.1] - Supported version change

- Updated supported version to 1.90.0 to allow install in Haystack Editor

## [1.0.0] - Release

- Initial release
- Includes basic functionality
