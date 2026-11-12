"use client";
import type { SceneEntity } from "./serializers/scene-document";
import type { TransformAction } from "./interactions/transform-controls";
import styles from "./workspace.module.css";

export default function TransformPanel({
  entity,
  disabled,
  onAction,
  onReset,
}: {
  entity: SceneEntity;
  disabled: boolean;
  onAction(action: TransformAction): void;
  onReset(): void;
}) {
  return (
    <fieldset className={styles.transforms} disabled={disabled}>
      <legend>Object transform</legend>
      <p className={styles.muted}>Move in metres, rotate in degrees, or scale the selection.</p>
      {(["x", "y", "z"] as const).map((axis, index) => (
        <div className={styles.transformRow} key={axis}>
          <span>{axis.toUpperCase()}</span>
          <button
            type="button"
            aria-label={`Move ${axis} negative`}
            onClick={() => onAction({ type: "move", axis, amount: -0.25 })}
          >
            −
          </button>
          <output aria-label={`Position ${axis}`}>
            {entity.transform.position[index].toFixed(2)}
          </output>
          <button
            type="button"
            aria-label={`Move ${axis} positive`}
            onClick={() => onAction({ type: "move", axis, amount: 0.25 })}
          >
            +
          </button>
        </div>
      ))}
      <div className={styles.transformActions}>
        <button type="button" onClick={() => onAction({ type: "rotate", axis: "y", amount: -15 })}>
          Rotate −15°
        </button>
        <button type="button" onClick={() => onAction({ type: "rotate", axis: "y", amount: 15 })}>
          Rotate +15°
        </button>
        <button type="button" onClick={() => onAction({ type: "scale", factor: 0.9 })}>
          Scale down
        </button>
        <button type="button" onClick={() => onAction({ type: "scale", factor: 1.1 })}>
          Scale up
        </button>
      </div>
      <p className={styles.muted}>
        Rotation {entity.transform.rotation.join("°, ")}° · Scale{" "}
        {entity.transform.scale.map((value) => value.toFixed(2)).join(" / ")}
      </p>
      <button type="button" className={styles.textButton} onClick={onReset}>
        Reset object
      </button>
    </fieldset>
  );
}
