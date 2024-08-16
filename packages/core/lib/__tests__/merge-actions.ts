import { mergeActions } from "../merge-actions";

jest.spyOn(console, "warn").mockImplementation(() => {});

describe("migrate method", () => {
  it("should merge an array of Insert and Move actions", () => {
    expect(
      mergeActions([
        {
          type: "insert",
          destinationIndex: 0,
          destinationZone: "my-zone",
          componentType: "My Item",
        },
        {
          type: "move",
          sourceIndex: 0,
          sourceZone: "my-zone",
          destinationIndex: 1,
          destinationZone: "my-zone",
        },
        {
          type: "move",
          sourceIndex: 0,
          sourceZone: "my-zone",
          destinationIndex: 3,
          destinationZone: "another-zone",
        },
      ])
    ).toEqual({
      type: "insert",
      destinationIndex: 3,
      destinationZone: "another-zone",
      componentType: "My Item",
    });
  });

  it("should skip unsupported actions", () => {
    expect(
      mergeActions([
        {
          type: "insert",
          destinationIndex: 0,
          destinationZone: "my-zone",
          componentType: "My Item",
        },
        {
          type: "move",
          sourceIndex: 0,
          sourceZone: "my-zone",
          destinationIndex: 1,
          destinationZone: "my-zone",
        },
        {
          type: "remove",
          index: 1,
          zone: "my-zone",
        },
        {
          type: "move",
          sourceIndex: 0,
          sourceZone: "my-zone",
          destinationIndex: 3,
          destinationZone: "another-zone",
        },
      ])
    ).toEqual({
      type: "insert",
      destinationIndex: 3,
      destinationZone: "another-zone",
      componentType: "My Item",
    });
  });

  it("should throw if an insert is inserted after another action", () => {
    expect(() =>
      mergeActions([
        {
          type: "move",
          sourceIndex: 0,
          sourceZone: "my-zone",
          destinationIndex: 1,
          destinationZone: "my-zone",
        },
        {
          type: "insert",
          destinationIndex: 0,
          destinationZone: "my-zone",
          componentType: "My Item",
        },
      ])
    ).toThrow();
  });
});
