using System.Collections.Generic;
using Godot;

/// <summary>
/// 状态效果组件
/// 管理中毒、眩晕、灼烧等持续效果，挂载于角色节点
/// </summary>
[GlobalClass]
public partial class StatusEffectComponent : Node
{
	// ===== 信号 =====

	[Signal]
	public delegate void EffectAppliedEventHandler(StatusEffectType type, float duration);

	[Signal]
	public delegate void EffectRemovedEventHandler(StatusEffectType type);

	// ===== 私有字段 =====

	private readonly Dictionary<StatusEffectType, EffectState> _effects = new();

	/// <summary>拥有者的 HealthComponent 引用</summary>
	private HealthComponent _health;

	public override void _Ready()
	{
		_health = GetParent()?.GetNode<HealthComponent>("HealthComponent");
	}

	public override void _Process(double delta)
	{
		List<StatusEffectType> toRemove = null;

		foreach (var kvp in _effects)
		{
			var effect = kvp.Value;
			effect.Remaining -= (float)delta;

			// 持续伤害 tick
			if (effect.TickDamage > 0f)
			{
				effect.TickTimer -= (float)delta;
				if (effect.TickTimer <= 0f)
				{
					effect.TickTimer = effect.TickInterval;
					_health?.ApplyPoisonDamage(effect.TickDamage);
				}
			}

			// 效果结束
			if (effect.Remaining <= 0f)
			{
				toRemove ??= new List<StatusEffectType>();
				toRemove.Add(kvp.Key);
			}
		}

		// 移除已结束的效果
		if (toRemove != null)
		{
			foreach (var type in toRemove)
			{
				_effects.Remove(type);
				EmitSignal(SignalName.EffectRemoved, (int)type);
			}
		}
	}

	/// <summary>
	/// 施加状态效果
	/// </summary>
	/// <param name="type">效果类型</param>
	/// <param name="duration">持续时间（秒）</param>
	/// <param name="tickDamage">每 tick 伤害（中毒/灼烧）</param>
	/// <param name="tickInterval">tick 间隔（秒）</param>
	public void ApplyEffect(StatusEffectType type, float duration, float tickDamage = 0f, float tickInterval = 1f)
	{
		if (duration <= 0f) return;

		if (_effects.ContainsKey(type))
		{
			// 刷新持续时间
			_effects[type].Remaining = duration;
		}
		else
		{
			_effects[type] = new EffectState
			{
				Remaining = duration,
				TickDamage = tickDamage,
				TickInterval = tickInterval,
				TickTimer = tickInterval
			};
		}

		EmitSignal(SignalName.EffectApplied, (int)type, duration);
	}

	/// <summary>
	/// 移除指定效果
	/// </summary>
	/// <param name="type">效果类型</param>
	public void RemoveEffect(StatusEffectType type)
	{
		if (_effects.Remove(type))
		{
			EmitSignal(SignalName.EffectRemoved, (int)type);
		}
	}

	/// <summary>
	/// 是否处于指定效果中
	/// </summary>
	/// <param name="type">效果类型</param>
	public bool HasEffect(StatusEffectType type) => _effects.ContainsKey(type);

	/// <summary>
	/// 清除所有效果
	/// </summary>
	public void ClearAll()
	{
		var types = new List<StatusEffectType>(_effects.Keys);
		_effects.Clear();
		foreach (var type in types)
		{
			EmitSignal(SignalName.EffectRemoved, (int)type);
		}
	}

	/// <summary>
	/// 效果状态内部结构
	/// </summary>
	private class EffectState
	{
		public float Remaining;
		public float TickDamage;
		public float TickInterval;
		public float TickTimer;
	}
}
